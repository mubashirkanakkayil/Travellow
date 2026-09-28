import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import Guide from "@/models/Guide";
import Destination from "@/models/Destination";

export const dynamic = "force-dynamic";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const ALLOWED_CURRENCIES = ["INR", "USD", "AED", "EUR", "GBP", "JPY"];

/**
 * GET /api/guides/[id]
 * Fetch a guide profile.
 * - Authenticated Guide (owner) or ADMIN: Returns full guide details including owner reference.
 * - Public / Other Users / Other Guides: Returns ONLY safe public guide profile fields.
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!id || (!OBJECT_ID_REGEX.test(id) && id !== "me")) {
      return NextResponse.json(
        { success: false, error: "Invalid guide ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const currentUser = await getCurrentUser();

    let guide = null;

    if (id === "me") {
      if (!currentUser) {
        return NextResponse.json(
          { success: false, error: "Authentication required to access own guide profile." },
          { status: 401 }
        );
      }
      guide = await Guide.findOne({ user: currentUser.id })
        .populate("destination", "name country slug region")
        .lean();

      if (!guide) {
        return NextResponse.json(
          { success: false, error: "No guide profile found for current user account." },
          { status: 404 }
        );
      }
    } else {
      guide = await Guide.findById(id)
        .populate("destination", "name country slug region")
        .lean();

      if (!guide) {
        return NextResponse.json(
          { success: false, error: "Guide not found." },
          { status: 404 }
        );
      }
    }

    const isOwner =
      currentUser &&
      guide.user &&
      guide.user.toString() === currentUser.id;
    const isAdmin = currentUser && currentUser.role === "ADMIN";

    // If caller is owner or admin, return full record
    if (isOwner || isAdmin) {
      return NextResponse.json({
        success: true,
        isOwner: Boolean(isOwner),
        data: guide,
      });
    }

    // Public / Other Guide: sanitize and return ONLY safe public fields
    const publicGuide = {
      _id: guide._id.toString(),
      name: guide.name,
      country: guide.country,
      bio: guide.bio,
      profileImage: guide.profileImage,
      languages: guide.languages || [],
      specialties: guide.specialties || [],
      rating: guide.rating || 0,
      reviewCount: guide.reviewCount || 0,
      hourlyRate: guide.hourlyRate,
      currency: guide.currency || "INR",
      verified: Boolean(guide.verified),
      experienceYears: guide.experienceYears || 0,
      destination: guide.destination,
    };

    return NextResponse.json({
      success: true,
      isOwner: false,
      data: publicGuide,
    });
  } catch (error) {
    console.error("GET /api/guides/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch guide profile." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/guides/[id]
 * Update guide profile information.
 * SERVER-SIDE AUTHORIZATION & OWNERSHIP:
 * - Allowed ONLY if current authenticated user OWNS the guide (guide.user === currentUser.id)
 *   OR current authenticated user is an ADMIN.
 * - Rejects with 401 if unauthenticated.
 * - Rejects with 403 if authenticated user is neither owner nor admin.
 */
export async function PATCH(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required to update guide profile." },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id || (!OBJECT_ID_REGEX.test(id) && id !== "me")) {
      return NextResponse.json(
        { success: false, error: "Invalid guide ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let guide = null;
    if (id === "me") {
      guide = await Guide.findOne({ user: currentUser.id });
    } else {
      guide = await Guide.findById(id);
    }

    if (!guide) {
      return NextResponse.json(
        { success: false, error: "Guide profile not found." },
        { status: 404 }
      );
    }

    // SERVER-SIDE OWNERSHIP ENFORCEMENT
    const isOwner = guide.user && guide.user.toString() === currentUser.id;
    const isAdmin = currentUser.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. You can only modify your own guide profile.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      destination,
      country,
      bio,
      profileImage,
      languages,
      specialties,
      hourlyRate,
      currency,
      experienceYears,
    } = body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { success: false, error: "Guide name cannot be empty." },
          { status: 400 }
        );
      }
      guide.name = name.trim();
    }

    if (destination !== undefined) {
      if (!OBJECT_ID_REGEX.test(destination)) {
        return NextResponse.json(
          { success: false, error: "Invalid destination selection." },
          { status: 400 }
        );
      }
      const destExists = await Destination.findById(destination);
      if (!destExists) {
        return NextResponse.json(
          { success: false, error: "Selected destination does not exist." },
          { status: 404 }
        );
      }
      guide.destination = destination;
    }

    if (country !== undefined) {
      if (typeof country !== "string" || !country.trim()) {
        return NextResponse.json(
          { success: false, error: "Country cannot be empty." },
          { status: 400 }
        );
      }
      guide.country = country.trim();
    }

    if (bio !== undefined) {
      if (typeof bio !== "string" || !bio.trim()) {
        return NextResponse.json(
          { success: false, error: "Bio cannot be empty." },
          { status: 400 }
        );
      }
      guide.bio = bio.trim();
    }

    if (profileImage !== undefined) {
      if (typeof profileImage !== "string" || !profileImage.trim()) {
        return NextResponse.json(
          { success: false, error: "Profile image URL cannot be empty." },
          { status: 400 }
        );
      }
      guide.profileImage = profileImage.trim();
    }

    if (hourlyRate !== undefined) {
      const parsedRate = Number(hourlyRate);
      if (isNaN(parsedRate) || parsedRate < 0) {
        return NextResponse.json(
          { success: false, error: "Hourly rate must be a non-negative number." },
          { status: 400 }
        );
      }
      guide.hourlyRate = parsedRate;
    }

    if (experienceYears !== undefined) {
      const parsedExp = Number(experienceYears);
      if (isNaN(parsedExp) || parsedExp < 0) {
        return NextResponse.json(
          { success: false, error: "Years of experience must be a non-negative number." },
          { status: 400 }
        );
      }
      guide.experienceYears = parsedExp;
    }

    if (currency !== undefined) {
      const upperCurrency = String(currency).toUpperCase().trim();
      if (ALLOWED_CURRENCIES.includes(upperCurrency)) {
        guide.currency = upperCurrency;
      }
    }

    if (languages !== undefined) {
      const parsedLangs = Array.isArray(languages)
        ? languages.map((l) => String(l).trim()).filter(Boolean)
        : typeof languages === "string"
        ? languages.split(",").map((l) => l.trim()).filter(Boolean)
        : [];
      if (parsedLangs.length > 0) {
        guide.languages = parsedLangs;
      }
    }

    if (specialties !== undefined) {
      const parsedSpecs = Array.isArray(specialties)
        ? specialties.map((s) => String(s).trim()).filter(Boolean)
        : typeof specialties === "string"
        ? specialties.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      guide.specialties = parsedSpecs;
    }

    // Admins can toggle verified status; non-admin owners cannot alter verified, rating, or reviewCount
    if (isAdmin && body.verified !== undefined) {
      guide.verified = Boolean(body.verified);
    }

    await guide.save();

    const updatedGuide = await Guide.findById(guide._id)
      .populate("destination", "name country slug region")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Guide profile updated successfully.",
      data: updatedGuide,
    });
  } catch (error) {
    console.error("PATCH /api/guides/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update guide profile." },
      { status: 500 }
    );
  }
}

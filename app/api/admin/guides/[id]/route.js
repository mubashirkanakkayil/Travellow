import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import Guide from "@/models/Guide";
import Destination from "@/models/Destination";
import Booking from "@/models/Booking";
import Review from "@/models/Review";

export const dynamic = "force-dynamic";

const ALLOWED_CURRENCIES = ["INR", "USD", "AED", "EUR", "GBP", "JPY"];

/**
 * GET /api/admin/guides/[id]
 * Retrieve a single local guide record with populated destination details.
 */
export async function GET(request, context) {
  try {
    const params = context?.params || {};
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Guide ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const guide = await Guide.findById(id).populate(
      "destination",
      "name country slug region"
    );

    if (!guide) {
      return NextResponse.json(
        { success: false, error: "Guide not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      guide,
    });
  } catch (error) {
    console.error("GET /api/admin/guides/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch guide.", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/guides/[id]
 * Update an existing local guide in MongoDB Atlas.
 * Validates inputs, referenced destination existence, hourlyRate >= 0, experienceYears >= 0.
 * Protects rating and reviewCount against client manipulation.
 */
export async function PATCH(request, context) {
  try {
    const params = context?.params || {};
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Guide ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const guide = await Guide.findById(id);
    if (!guide) {
      return NextResponse.json(
        { success: false, error: "Guide not found." },
        { status: 404 }
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
      verified,
      experienceYears,
    } = body;

    // Validate and update Name
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { success: false, error: "Guide name cannot be empty." },
          { status: 400 }
        );
      }
      guide.name = name.trim();
    }

    // Validate and update Destination reference
    if (destination !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(destination)) {
        return NextResponse.json(
          { success: false, error: "Invalid Destination ID format." },
          { status: 400 }
        );
      }
      const destExists = await Destination.findById(destination);
      if (!destExists) {
        return NextResponse.json(
          { success: false, error: "Referenced destination does not exist in database." },
          { status: 400 }
        );
      }
      guide.destination = destination;
    }

    // Validate and update Country
    if (country !== undefined) {
      if (typeof country !== "string" || !country.trim()) {
        return NextResponse.json(
          { success: false, error: "Country cannot be empty." },
          { status: 400 }
        );
      }
      guide.country = country.trim();
    }

    // Validate and update Bio
    if (bio !== undefined) {
      if (typeof bio !== "string" || !bio.trim()) {
        return NextResponse.json(
          { success: false, error: "Guide bio cannot be empty." },
          { status: 400 }
        );
      }
      guide.bio = bio.trim();
    }

    // Validate and update Profile Image
    if (profileImage !== undefined) {
      if (typeof profileImage !== "string" || !profileImage.trim()) {
        return NextResponse.json(
          { success: false, error: "Profile image URL cannot be empty." },
          { status: 400 }
        );
      }
      guide.profileImage = profileImage.trim();
    }

    // Validate and update Hourly Rate
    if (hourlyRate !== undefined) {
      const parsedRate = parseFloat(hourlyRate);
      if (isNaN(parsedRate) || parsedRate < 0) {
        return NextResponse.json(
          { success: false, error: "Hourly rate must be a valid number greater than or equal to 0." },
          { status: 400 }
        );
      }
      guide.hourlyRate = parsedRate;
    }

    // Validate and update Experience Years
    if (experienceYears !== undefined) {
      const parsedExp = parseInt(experienceYears, 10);
      if (isNaN(parsedExp) || parsedExp < 0) {
        return NextResponse.json(
          { success: false, error: "Experience years must be a number greater than or equal to 0." },
          { status: 400 }
        );
      }
      guide.experienceYears = parsedExp;
    }

    // Currency Enum Check
    if (currency !== undefined) {
      if (ALLOWED_CURRENCIES.includes(currency?.toUpperCase())) {
        guide.currency = currency.toUpperCase();
      }
    }

    // Arrays Formatting
    if (languages !== undefined) {
      const formattedLangs = Array.isArray(languages)
        ? languages.map((item) => String(item).trim()).filter(Boolean)
        : typeof languages === "string"
        ? languages.split("\n").map((item) => item.trim()).filter(Boolean)
        : [];
      if (formattedLangs.length > 0) {
        guide.languages = formattedLangs;
      }
    }

    if (specialties !== undefined) {
      guide.specialties = Array.isArray(specialties)
        ? specialties.map((item) => String(item).trim()).filter(Boolean)
        : typeof specialties === "string"
        ? specialties.split("\n").map((item) => item.trim()).filter(Boolean)
        : [];
    }

    if (verified !== undefined) {
      guide.verified = Boolean(verified);
    }

    // Rating and reviewCount are strictly preserved without client modification

    await guide.save();

    const updatedGuide = await Guide.findById(id).populate(
      "destination",
      "name country slug region"
    );

    return NextResponse.json({
      success: true,
      message: "Guide updated successfully.",
      guide: updatedGuide,
    });
  } catch (error) {
    console.error("PATCH /api/admin/guides/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update guide.", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/guides/[id]
 * Safely delete a local guide from MongoDB Atlas.
 * Checks for dependent Booking and Review records before allowing deletion.
 */
export async function DELETE(request, context) {
  try {
    const params = context?.params || {};
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Guide ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const guide = await Guide.findById(id);
    if (!guide) {
      return NextResponse.json(
        { success: false, error: "Guide not found." },
        { status: 404 }
      );
    }

    // Check dependent collections before deleting
    const [bookingCount, reviewCount] = await Promise.all([
      Booking.countDocuments({ guide: id }),
      Review.countDocuments({ guide: id }),
    ]);

    if (bookingCount > 0 || reviewCount > 0) {
      const dependencies = [];
      if (bookingCount > 0) dependencies.push(`${bookingCount} booking(s)`);
      if (reviewCount > 0) dependencies.push(`${reviewCount} review(s)`);

      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete this guide because related ${dependencies.join(" and ")} exist.`,
          dependencies: { bookingCount, reviewCount },
        },
        { status: 409 }
      );
    }

    await Guide.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Guide "${guide.name}" deleted successfully.`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/guides/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete guide.", details: error.message },
      { status: 500 }
    );
  }
}

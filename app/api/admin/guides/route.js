import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import Guide from "@/models/Guide";
import Destination from "@/models/Destination";

export const dynamic = "force-dynamic";

const ALLOWED_CURRENCIES = ["INR", "USD", "AED", "EUR", "GBP", "JPY"];

/**
 * GET /api/admin/guides
 * Retrieve all guides for admin catalog management.
 * Supports: search, destination, country, verified, sorting, pagination.
 */
export async function GET(request) {
  try {
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

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const destination = searchParams.get("destination");
    const country = searchParams.get("country");
    const verified = searchParams.get("verified");
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "50", 10));

    const query = {};

    // Filter by destination ID or slug
    if (destination && destination !== "ALL") {
      if (mongoose.Types.ObjectId.isValid(destination)) {
        query.destination = destination;
      } else {
        const destDoc = await Destination.findOne({ slug: destination });
        if (destDoc) {
          query.destination = destDoc._id;
        }
      }
    }

    // Country filter
    if (country && country.trim()) {
      query.country = new RegExp(country.trim(), "i");
    }

    // Verified filter
    if (verified === "true") {
      query.verified = true;
    } else if (verified === "false") {
      query.verified = false;
    }

    // Search query across name, country, bio, specialties, languages
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { country: searchRegex },
        { bio: searchRegex },
        { specialties: searchRegex },
        { languages: searchRegex },
      ];
    }

    // Sorting options
    let sortOptions = { createdAt: -1 };
    if (sort === "rate_asc") sortOptions = { hourlyRate: 1 };
    if (sort === "rate_desc") sortOptions = { hourlyRate: -1 };
    if (sort === "rating") sortOptions = { rating: -1 };
    if (sort === "experience") sortOptions = { experienceYears: -1 };
    if (sort === "name") sortOptions = { name: 1 };

    const total = await Guide.countDocuments(query);
    const skip = (page - 1) * limit;

    const guides = await Guide.find(query)
      .populate("destination", "name country slug region")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      count: guides.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      guides,
    });
  } catch (error) {
    console.error("GET /api/admin/guides Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch guides.", details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/guides
 * Create a new local guide in MongoDB Atlas.
 * Validates inputs, referenced destination existence, hourlyRate >= 0, experienceYears >= 0.
 */
export async function POST(request) {
  try {
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

    await connectToDatabase();

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
      currency = "INR",
      verified = true,
      experienceYears = 3,
    } = body;

    // Required Field Validations
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Guide name is required." },
        { status: 400 }
      );
    }

    if (!destination) {
      return NextResponse.json(
        { success: false, error: "Destination reference is required." },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(destination)) {
      return NextResponse.json(
        { success: false, error: "Invalid Destination ID format." },
        { status: 400 }
      );
    }

    // Verify referenced destination exists in MongoDB
    const destExists = await Destination.findById(destination);
    if (!destExists) {
      return NextResponse.json(
        { success: false, error: "Referenced destination does not exist in database." },
        { status: 400 }
      );
    }

    if (!country || typeof country !== "string" || !country.trim()) {
      return NextResponse.json(
        { success: false, error: "Country is required." },
        { status: 400 }
      );
    }

    if (!bio || typeof bio !== "string" || !bio.trim()) {
      return NextResponse.json(
        { success: false, error: "Guide bio is required." },
        { status: 400 }
      );
    }

    if (!profileImage || typeof profileImage !== "string" || !profileImage.trim()) {
      return NextResponse.json(
        { success: false, error: "Profile image URL is required." },
        { status: 400 }
      );
    }

    // Hourly Rate Validation
    const parsedRate = parseFloat(hourlyRate);
    if (isNaN(parsedRate) || parsedRate < 0) {
      return NextResponse.json(
        { success: false, error: "Hourly rate must be a valid number greater than or equal to 0." },
        { status: 400 }
      );
    }

    // Experience Years Validation
    const parsedExp = parseInt(experienceYears, 10);
    if (isNaN(parsedExp) || parsedExp < 0) {
      return NextResponse.json(
        { success: false, error: "Experience years must be a number greater than or equal to 0." },
        { status: 400 }
      );
    }

    // Currency Enum Check
    const finalCurrency = ALLOWED_CURRENCIES.includes(currency?.toUpperCase())
      ? currency.toUpperCase()
      : "INR";

    // Arrays Formatting
    const formattedLanguages = Array.isArray(languages)
      ? languages.map((item) => String(item).trim()).filter(Boolean)
      : typeof languages === "string"
      ? languages.split("\n").map((item) => item.trim()).filter(Boolean)
      : ["English"];

    const formattedSpecialties = Array.isArray(specialties)
      ? specialties.map((item) => String(item).trim()).filter(Boolean)
      : typeof specialties === "string"
      ? specialties.split("\n").map((item) => item.trim()).filter(Boolean)
      : [];

    // Construct Guide Document (force rating = 0 and reviewCount = 0 for new guide)
    const guidePayload = {
      name: name.trim(),
      destination,
      country: country.trim(),
      bio: bio.trim(),
      profileImage: profileImage.trim(),
      languages: formattedLanguages.length > 0 ? formattedLanguages : ["English"],
      specialties: formattedSpecialties,
      hourlyRate: parsedRate,
      currency: finalCurrency,
      verified: Boolean(verified),
      experienceYears: parsedExp,
      rating: 0,
      reviewCount: 0,
    };

    if (body.userId && mongoose.Types.ObjectId.isValid(body.userId)) {
      guidePayload.user = body.userId;
    }

    const newGuide = await Guide.create(guidePayload);

    const populatedGuide = await Guide.findById(newGuide._id).populate(
      "destination",
      "name country slug region"
    );

    return NextResponse.json(
      {
        success: true,
        message: "Guide created successfully.",
        guide: populatedGuide,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/guides Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create guide.", details: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import Destination from "@/models/Destination";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Normalize slug to URL-safe format: e.g. "Kerala Travel Guide" -> "kerala-travel-guide"
 */
function normalizeSlug(rawSlug) {
  if (!rawSlug || typeof rawSlug !== "string") return "";
  return rawSlug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * GET /api/admin/destinations
 * Returns destination records for admin management.
 * Requires ADMIN role.
 */
export async function GET(request) {
  try {
    // 1. Authenticate user & authorize ADMIN role
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const country = searchParams.get("country");
    const region = searchParams.get("region");

    const query = {};

    if (region && region !== "ALL") {
      query.region = region.toUpperCase();
    }

    if (country) {
      query.country = new RegExp(country, "i");
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { country: new RegExp(search, "i") },
        { slug: new RegExp(search, "i") },
        { shortDescription: new RegExp(search, "i") },
      ];
    }

    const destinations = await Destination.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: destinations.length,
      destinations: destinations.map((d) => ({
        ...d,
        _id: d._id.toString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/destinations Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin destinations." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/destinations
 * Creates a new destination in MongoDB.
 * Requires ADMIN role.
 */
export async function POST(request) {
  try {
    // 1. Authenticate user & authorize ADMIN role
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      name,
      country,
      region,
      slug,
      description,
      shortDescription,
      image,
      gallery,
      startingPrice,
      currency,
      bestTimeToVisit,
      activities,
      highlights,
      latitude,
      longitude,
      featured,
    } = body;

    // 2. Validate required string fields
    const trimmedName = String(name || "").trim();
    if (!trimmedName) {
      return NextResponse.json(
        { success: false, error: "Destination name is required." },
        { status: 400 }
      );
    }

    const trimmedCountry = String(country || "").trim();
    if (!trimmedCountry) {
      return NextResponse.json(
        { success: false, error: "Country is required." },
        { status: 400 }
      );
    }

    const validRegions = ["INDIA", "ASIA", "EUROPE"];
    const upperRegion = String(region || "").toUpperCase().trim();
    if (!validRegions.includes(upperRegion)) {
      return NextResponse.json(
        { success: false, error: "Region must be INDIA, ASIA, or EUROPE." },
        { status: 400 }
      );
    }

    const normalizedSlug = normalizeSlug(slug || trimmedName);
    if (!normalizedSlug) {
      return NextResponse.json(
        { success: false, error: "A valid slug is required." },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existingSlug = await Destination.findOne({ slug: normalizedSlug }).lean();
    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: `Slug "${normalizedSlug}" already exists. Please choose a unique slug.` },
        { status: 409 }
      );
    }

    const trimmedDesc = String(description || "").trim();
    if (!trimmedDesc) {
      return NextResponse.json(
        { success: false, error: "Description is required." },
        { status: 400 }
      );
    }

    const trimmedShortDesc = String(shortDescription || "").trim();
    if (!trimmedShortDesc) {
      return NextResponse.json(
        { success: false, error: "Short description is required." },
        { status: 400 }
      );
    }

    const trimmedImage = String(image || "").trim();
    if (!trimmedImage) {
      return NextResponse.json(
        { success: false, error: "Main image URL is required." },
        { status: 400 }
      );
    }

    // Validate Starting Price
    const priceNum = Number(startingPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { success: false, error: "Starting price must be a valid number greater than or equal to 0." },
        { status: 400 }
      );
    }

    const validCurrencies = ["INR", "USD", "AED", "EUR", "GBP", "JPY"];
    const upperCurrency = String(currency || "INR").toUpperCase().trim();
    if (!validCurrencies.includes(upperCurrency)) {
      return NextResponse.json(
        { success: false, error: "Invalid currency selected." },
        { status: 400 }
      );
    }

    // Validate Coordinates
    const latNum = Number(latitude);
    const lonNum = Number(longitude);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      return NextResponse.json(
        { success: false, error: "Latitude must be a number between -90 and 90." },
        { status: 400 }
      );
    }
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      return NextResponse.json(
        { success: false, error: "Longitude must be a number between -180 and 180." },
        { status: 400 }
      );
    }

    // Parse array fields safely
    const safeGallery = Array.isArray(gallery)
      ? gallery.map((g) => String(g).trim()).filter(Boolean)
      : [];
    const safeActivities = Array.isArray(activities)
      ? activities.map((a) => String(a).trim()).filter(Boolean)
      : [];
    const safeHighlights = Array.isArray(highlights)
      ? highlights.map((h) => String(h).trim()).filter(Boolean)
      : [];

    // 3. Create Destination record (ratings start at 0 / default)
    const newDestination = await Destination.create({
      name: trimmedName,
      country: trimmedCountry,
      region: upperRegion,
      slug: normalizedSlug,
      description: trimmedDesc,
      shortDescription: trimmedShortDesc,
      image: trimmedImage,
      gallery: safeGallery,
      rating: 0,
      reviewCount: 0,
      startingPrice: priceNum,
      currency: upperCurrency,
      bestTimeToVisit: String(bestTimeToVisit || "").trim(),
      activities: safeActivities,
      highlights: safeHighlights,
      latitude: latNum,
      longitude: lonNum,
      featured: Boolean(featured),
    });

    return NextResponse.json(
      {
        success: true,
        destination: {
          ...newDestination.toObject(),
          _id: newDestination._id.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/destinations Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create destination." },
      { status: 500 }
    );
  }
}

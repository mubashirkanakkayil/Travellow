import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import Destination from "@/models/Destination";
import Hotel from "@/models/Hotel";
import Guide from "@/models/Guide";
import Booking from "@/models/Booking";
import Review from "@/models/Review";
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
 * PATCH /api/admin/destinations/[id]
 * Updates an existing destination in MongoDB.
 * Requires ADMIN role.
 */
export async function PATCH(request, { params }) {
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
        { success: false, error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid destination ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const destination = await Destination.findById(id);
    if (!destination) {
      return NextResponse.json(
        { success: false, error: "Destination not found." },
        { status: 404 }
      );
    }

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

    // Validate name
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return NextResponse.json(
          { success: false, error: "Destination name cannot be empty." },
          { status: 400 }
        );
      }
      destination.name = trimmedName;
    }

    // Validate country
    if (country !== undefined) {
      const trimmedCountry = String(country).trim();
      if (!trimmedCountry) {
        return NextResponse.json(
          { success: false, error: "Country cannot be empty." },
          { status: 400 }
        );
      }
      destination.country = trimmedCountry;
    }

    // Validate region
    if (region !== undefined) {
      const validRegions = ["INDIA", "ASIA", "EUROPE"];
      const upperRegion = String(region).toUpperCase().trim();
      if (!validRegions.includes(upperRegion)) {
        return NextResponse.json(
          { success: false, error: "Region must be INDIA, ASIA, or EUROPE." },
          { status: 400 }
        );
      }
      destination.region = upperRegion;
    }

    // Validate slug
    if (slug !== undefined || name !== undefined) {
      const normalizedSlug = normalizeSlug(slug || destination.slug || destination.name);
      if (!normalizedSlug) {
        return NextResponse.json(
          { success: false, error: "A valid slug is required." },
          { status: 400 }
        );
      }

      // Check slug uniqueness across OTHER destinations
      const existingSlug = await Destination.findOne({
        slug: normalizedSlug,
        _id: { $ne: id },
      }).lean();

      if (existingSlug) {
        return NextResponse.json(
          { success: false, error: `Slug "${normalizedSlug}" already exists on another destination.` },
          { status: 409 }
        );
      }

      destination.slug = normalizedSlug;
    }

    if (description !== undefined) {
      destination.description = String(description).trim();
    }
    if (shortDescription !== undefined) {
      destination.shortDescription = String(shortDescription).trim();
    }
    if (image !== undefined) {
      destination.image = String(image).trim();
    }
    if (bestTimeToVisit !== undefined) {
      destination.bestTimeToVisit = String(bestTimeToVisit).trim();
    }

    if (startingPrice !== undefined) {
      const priceNum = Number(startingPrice);
      if (isNaN(priceNum) || priceNum < 0) {
        return NextResponse.json(
          { success: false, error: "Starting price must be a valid number >= 0." },
          { status: 400 }
        );
      }
      destination.startingPrice = priceNum;
    }

    if (currency !== undefined) {
      const validCurrencies = ["INR", "USD", "AED", "EUR", "GBP", "JPY"];
      const upperCurrency = String(currency).toUpperCase().trim();
      if (!validCurrencies.includes(upperCurrency)) {
        return NextResponse.json(
          { success: false, error: "Invalid currency selected." },
          { status: 400 }
        );
      }
      destination.currency = upperCurrency;
    }

    if (latitude !== undefined) {
      const latNum = Number(latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        return NextResponse.json(
          { success: false, error: "Latitude must be a number between -90 and 90." },
          { status: 400 }
        );
      }
      destination.latitude = latNum;
    }

    if (longitude !== undefined) {
      const lonNum = Number(longitude);
      if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
        return NextResponse.json(
          { success: false, error: "Longitude must be a number between -180 and 180." },
          { status: 400 }
        );
      }
      destination.longitude = lonNum;
    }

    if (gallery !== undefined && Array.isArray(gallery)) {
      destination.gallery = gallery.map((g) => String(g).trim()).filter(Boolean);
    }
    if (activities !== undefined && Array.isArray(activities)) {
      destination.activities = activities.map((a) => String(a).trim()).filter(Boolean);
    }
    if (highlights !== undefined && Array.isArray(highlights)) {
      destination.highlights = highlights.map((h) => String(h).trim()).filter(Boolean);
    }

    if (featured !== undefined) {
      destination.featured = Boolean(featured);
    }

    // Save updated destination
    await destination.save();

    return NextResponse.json({
      success: true,
      destination: {
        ...destination.toObject(),
        _id: destination._id.toString(),
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/destinations/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update destination." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/destinations/[id]
 * Safely deletes a destination if zero related records exist.
 * Requires ADMIN role.
 */
export async function DELETE(request, { params }) {
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
        { success: false, error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid destination ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const destination = await Destination.findById(id);
    if (!destination) {
      return NextResponse.json(
        { success: false, error: "Destination not found." },
        { status: 404 }
      );
    }

    // Check for dependent records across Hotel, Guide, Booking, and Review collections
    const [hotelCount, guideCount, bookingCount, reviewCount] = await Promise.all([
      Hotel.countDocuments({ destination: id }),
      Guide.countDocuments({ destination: id }),
      Booking.countDocuments({ destination: id }),
      Review.countDocuments({ destination: id }),
    ]);

    const hasDependencies =
      hotelCount > 0 || guideCount > 0 || bookingCount > 0 || reviewCount > 0;

    if (hasDependencies) {
      const parts = [];
      if (hotelCount > 0) parts.push(`${hotelCount} hotel(s)`);
      if (guideCount > 0) parts.push(`${guideCount} guide(s)`);
      if (bookingCount > 0) parts.push(`${bookingCount} booking(s)`);
      if (reviewCount > 0) parts.push(`${reviewCount} review(s)`);

      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete "${destination.name}" because related records exist: ${parts.join(
            ", "
          )}. Please remove or reassign dependent records first.`,
          dependencies: {
            hotels: hotelCount,
            guides: guideCount,
            bookings: bookingCount,
            reviews: reviewCount,
          },
        },
        { status: 409 }
      );
    }

    // Delete destination safely
    await destination.deleteOne();

    return NextResponse.json({
      success: true,
      message: `Destination "${destination.name}" deleted successfully.`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/destinations/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete destination." },
      { status: 500 }
    );
  }
}

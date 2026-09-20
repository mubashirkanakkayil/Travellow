import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import Hotel from "@/models/Hotel";
import Destination from "@/models/Destination";
import Booking from "@/models/Booking";
import Review from "@/models/Review";

export const dynamic = "force-dynamic";

const ALLOWED_CURRENCIES = ["INR", "USD", "AED", "EUR", "GBP", "JPY"];

/**
 * GET /api/admin/hotels/[id]
 * Fetch a single hotel record by ID with populated destination.
 */
export async function GET(request, { params }) {
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

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Hotel ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const hotel = await Hotel.findById(id).populate(
      "destination",
      "name country slug region"
    );

    if (!hotel) {
      return NextResponse.json(
        { success: false, error: "Hotel not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hotel,
    });
  } catch (error) {
    console.error("GET /api/admin/hotels/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch hotel.", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/hotels/[id]
 * Update an existing hotel record in MongoDB Atlas.
 * Validates inputs, destination ObjectId existence, price >= 0, coordinates.
 * Prevents client override of rating and reviewCount.
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
        { success: false, error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Hotel ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return NextResponse.json(
        { success: false, error: "Hotel not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    const {
      name,
      destination,
      country,
      description,
      image,
      gallery,
      pricePerNight,
      currency,
      amenities,
      address,
      latitude,
      longitude,
      featured,
      aiEligible,
    } = body;

    // Validate and update Name
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { success: false, error: "Hotel name cannot be empty." },
          { status: 400 }
        );
      }
      hotel.name = name.trim();
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
      hotel.destination = destination;
    }

    // Validate and update Country
    if (country !== undefined) {
      if (typeof country !== "string" || !country.trim()) {
        return NextResponse.json(
          { success: false, error: "Country cannot be empty." },
          { status: 400 }
        );
      }
      hotel.country = country.trim();
    }

    // Validate and update Description
    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return NextResponse.json(
          { success: false, error: "Description cannot be empty." },
          { status: 400 }
        );
      }
      hotel.description = description.trim();
    }

    // Validate and update Image
    if (image !== undefined) {
      if (typeof image !== "string" || !image.trim()) {
        return NextResponse.json(
          { success: false, error: "Main image URL cannot be empty." },
          { status: 400 }
        );
      }
      hotel.image = image.trim();
    }

    // Validate and update Price Per Night
    if (pricePerNight !== undefined) {
      const parsedPrice = parseFloat(pricePerNight);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json(
          { success: false, error: "Price per night must be a valid number greater than or equal to 0." },
          { status: 400 }
        );
      }
      hotel.pricePerNight = parsedPrice;
    }

    // Currency Enum Check
    if (currency !== undefined) {
      if (ALLOWED_CURRENCIES.includes(currency?.toUpperCase())) {
        hotel.currency = currency.toUpperCase();
      }
    }

    // Latitude & Longitude Bounds Validation
    if (latitude !== undefined && latitude !== null && latitude !== "") {
      const latNum = parseFloat(latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        return NextResponse.json(
          { success: false, error: "Latitude must be a number between -90 and 90." },
          { status: 400 }
        );
      }
      hotel.latitude = latNum;
    }

    if (longitude !== undefined && longitude !== null && longitude !== "") {
      const lonNum = parseFloat(longitude);
      if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
        return NextResponse.json(
          { success: false, error: "Longitude must be a number between -180 and 180." },
          { status: 400 }
        );
      }
      hotel.longitude = lonNum;
    }

    // Arrays Formatting
    if (gallery !== undefined) {
      hotel.gallery = Array.isArray(gallery)
        ? gallery.map((item) => String(item).trim()).filter(Boolean)
        : typeof gallery === "string"
        ? gallery.split("\n").map((item) => item.trim()).filter(Boolean)
        : [];
    }

    if (amenities !== undefined) {
      hotel.amenities = Array.isArray(amenities)
        ? amenities.map((item) => String(item).trim()).filter(Boolean)
        : typeof amenities === "string"
        ? amenities.split("\n").map((item) => item.trim()).filter(Boolean)
        : [];
    }

    if (address !== undefined) {
      hotel.address = typeof address === "string" ? address.trim() : "";
    }

    if (featured !== undefined) {
      hotel.featured = Boolean(featured);
    }

    if (aiEligible !== undefined) {
      hotel.aiEligible = Boolean(aiEligible);
    }

    // Preserve rating and reviewCount
    await hotel.save();

    const updatedHotel = await Hotel.findById(id).populate(
      "destination",
      "name country slug region"
    );

    return NextResponse.json({
      success: true,
      message: "Hotel updated successfully.",
      hotel: updatedHotel,
    });
  } catch (error) {
    console.error("PATCH /api/admin/hotels/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update hotel.", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/hotels/[id]
 * Safely delete a hotel from MongoDB Atlas.
 * Checks for dependent Booking and Review records before allowing deletion.
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
        { success: false, error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Hotel ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return NextResponse.json(
        { success: false, error: "Hotel not found." },
        { status: 404 }
      );
    }

    // Check dependent collections before deleting
    const [bookingCount, reviewCount] = await Promise.all([
      Booking.countDocuments({ hotel: id }),
      Review.countDocuments({ hotel: id }),
    ]);

    if (bookingCount > 0 || reviewCount > 0) {
      const dependencies = [];
      if (bookingCount > 0) dependencies.push(`${bookingCount} booking(s)`);
      if (reviewCount > 0) dependencies.push(`${reviewCount} review(s)`);

      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete this hotel because related ${dependencies.join(" and ")} exist.`,
          dependencies: { bookingCount, reviewCount },
        },
        { status: 409 }
      );
    }

    await Hotel.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Hotel "${hotel.name}" deleted successfully.`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/hotels/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete hotel.", details: error.message },
      { status: 500 }
    );
  }
}

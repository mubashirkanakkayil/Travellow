import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import Hotel from "@/models/Hotel";
import Destination from "@/models/Destination";

export const dynamic = "force-dynamic";

// Allowed currencies per Hotel model schema enum
const ALLOWED_CURRENCIES = ["INR", "USD", "AED", "EUR", "GBP", "JPY"];

/**
 * GET /api/admin/hotels
 * Retrieve all hotels for admin catalog management.
 * Supports: search, destination, country, featured, aiEligible, sorting, pagination.
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
    const featured = searchParams.get("featured");
    const aiEligible = searchParams.get("aiEligible");
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

    // Featured filter
    if (featured === "true") {
      query.featured = true;
    } else if (featured === "false") {
      query.featured = false;
    }

    // AI Eligible filter
    if (aiEligible === "true") {
      query.aiEligible = true;
    } else if (aiEligible === "false") {
      query.aiEligible = false;
    }

    // Search query across name, country, description, address
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { country: searchRegex },
        { description: searchRegex },
        { address: searchRegex },
      ];
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === "price_asc") sortOptions = { pricePerNight: 1 };
    if (sort === "price_desc") sortOptions = { pricePerNight: -1 };
    if (sort === "rating") sortOptions = { rating: -1 };
    if (sort === "name") sortOptions = { name: 1 };

    const total = await Hotel.countDocuments(query);
    const skip = (page - 1) * limit;

    const hotels = await Hotel.find(query)
      .populate("destination", "name country slug region")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      count: hotels.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      hotels,
    });
  } catch (error) {
    console.error("GET /api/admin/hotels Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch hotels.", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/hotels
 * Create a new hotel in MongoDB Atlas.
 * Validates inputs, referenced destination existence, price >= 0, coordinates.
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
      description,
      image,
      gallery,
      pricePerNight,
      currency = "INR",
      amenities,
      address,
      latitude,
      longitude,
      featured = false,
      aiEligible = true,
    } = body;

    // Required Field Validations
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Hotel name is required." },
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

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { success: false, error: "Description is required." },
        { status: 400 }
      );
    }

    if (!image || typeof image !== "string" || !image.trim()) {
      return NextResponse.json(
        { success: false, error: "Main image URL is required." },
        { status: 400 }
      );
    }

    // Price Validation
    const parsedPrice = parseFloat(pricePerNight);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { success: false, error: "Price per night must be a valid number greater than or equal to 0." },
        { status: 400 }
      );
    }

    // Currency Enum Check
    const finalCurrency = ALLOWED_CURRENCIES.includes(currency?.toUpperCase())
      ? currency.toUpperCase()
      : "INR";

    // Latitude & Longitude Bounds Validation
    let latNum = 0;
    let lonNum = 0;

    if (latitude !== undefined && latitude !== null && latitude !== "") {
      latNum = parseFloat(latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        return NextResponse.json(
          { success: false, error: "Latitude must be a number between -90 and 90." },
          { status: 400 }
        );
      }
    }

    if (longitude !== undefined && longitude !== null && longitude !== "") {
      lonNum = parseFloat(longitude);
      if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
        return NextResponse.json(
          { success: false, error: "Longitude must be a number between -180 and 180." },
          { status: 400 }
        );
      }
    }

    // Arrays Formatting
    const formattedGallery = Array.isArray(gallery)
      ? gallery.map((item) => String(item).trim()).filter(Boolean)
      : typeof gallery === "string"
      ? gallery.split("\n").map((item) => item.trim()).filter(Boolean)
      : [];

    const formattedAmenities = Array.isArray(amenities)
      ? amenities.map((item) => String(item).trim()).filter(Boolean)
      : typeof amenities === "string"
      ? amenities.split("\n").map((item) => item.trim()).filter(Boolean)
      : [];

    // Construct Hotel Document (force rating = 0 and reviewCount = 0 for new hotel)
    const newHotel = await Hotel.create({
      name: name.trim(),
      destination,
      country: country.trim(),
      description: description.trim(),
      image: image.trim(),
      gallery: formattedGallery,
      pricePerNight: parsedPrice,
      currency: finalCurrency,
      amenities: formattedAmenities,
      address: typeof address === "string" ? address.trim() : "",
      latitude: latNum,
      longitude: lonNum,
      featured: Boolean(featured),
      aiEligible: Boolean(aiEligible),
      rating: 0,
      reviewCount: 0,
    });

    const populatedHotel = await Hotel.findById(newHotel._id).populate(
      "destination",
      "name country slug region"
    );

    return NextResponse.json(
      {
        success: true,
        message: "Hotel created successfully.",
        hotel: populatedHotel,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/hotels Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create hotel.", details: error.message },
      { status: 500 }
    );
  }
}

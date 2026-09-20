import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import Review from "@/models/Review";
import User from "@/models/User";
import Destination from "@/models/Destination";
import Hotel from "@/models/Hotel";
import Guide from "@/models/Guide";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reviews
 * Fetch all platform reviews with pagination, search, rating/target filtering,
 * safe user projections, and real MongoDB review statistics.
 */
export async function GET(request) {
  try {
    // 1. Server-side session authentication
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    // 2. Server-side ADMIN role authorization
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const targetType = searchParams.get("targetType")?.trim() || "";
    const ratingParam = searchParams.get("rating")?.trim() || "";
    const destinationId = searchParams.get("destination")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const sort = searchParams.get("sort") || "newest";

    const query = {};

    // Target Type Filter
    if (targetType.toUpperCase() === "DESTINATION") {
      query.destination = { $ne: null };
    } else if (targetType.toUpperCase() === "HOTEL") {
      query.hotel = { $ne: null };
    } else if (targetType.toUpperCase() === "GUIDE") {
      query.guide = { $ne: null };
    }

    // Rating Filter (1-5)
    const parsedRating = parseInt(ratingParam, 10);
    if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
      query.rating = parsedRating;
    }

    // Destination Filter
    if (destinationId && mongoose.Types.ObjectId.isValid(destinationId)) {
      query.destination = destinationId;
    }

    // Server-side Search
    if (search) {
      const searchRegex = new RegExp(search, "i");

      // Match users by name/email
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select("_id").lean();
      const matchingUserIds = matchingUsers.map((u) => u._id);

      // Match destinations
      const matchingDestinations = await Destination.find({
        $or: [{ name: searchRegex }, { country: searchRegex }],
      }).select("_id").lean();
      const matchingDestIds = matchingDestinations.map((d) => d._id);

      // Match hotels
      const matchingHotels = await Hotel.find({ name: searchRegex }).select("_id").lean();
      const matchingHotelIds = matchingHotels.map((h) => h._id);

      // Match guides
      const matchingGuides = await Guide.find({ name: searchRegex }).select("_id").lean();
      const matchingGuideIds = matchingGuides.map((g) => g._id);

      query.$or = [
        { comment: searchRegex },
        { user: { $in: matchingUserIds } },
        { destination: { $in: matchingDestIds } },
        { hotel: { $in: matchingHotelIds } },
        { guide: { $in: matchingGuideIds } },
      ];
    }

    // Sorting Options
    let sortOptions = { createdAt: -1 };
    if (sort === "oldest") sortOptions = { createdAt: 1 };
    if (sort === "rating-high") sortOptions = { rating: -1, createdAt: -1 };
    if (sort === "rating-low") sortOptions = { rating: 1, createdAt: -1 };

    // Calculate real MongoDB statistics in parallel
    const [
      totalReviews,
      star5Count,
      star4Count,
      star3Count,
      star2Count,
      star1Count,
      destinationCount,
      hotelCount,
      guideCount,
      filteredTotal,
    ] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ rating: 5 }),
      Review.countDocuments({ rating: 4 }),
      Review.countDocuments({ rating: 3 }),
      Review.countDocuments({ rating: 2 }),
      Review.countDocuments({ rating: 1 }),
      Review.countDocuments({ destination: { $ne: null } }),
      Review.countDocuments({ hotel: { $ne: null } }),
      Review.countDocuments({ guide: { $ne: null } }),
      Review.countDocuments(query),
    ]);

    const skip = (page - 1) * limit;

    // Fetch review records with safe projections (excluding user password/hash)
    const reviews = await Review.find(query)
      .populate("user", "name email profileImage")
      .populate("destination", "name country region slug image")
      .populate("hotel", "name image pricePerNight currency destination")
      .populate("guide", "name profileImage hourlyRate currency destination")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedReviews = reviews.map((r) => {
      let targetTypeStr = "UNKNOWN";
      if (r.destination) targetTypeStr = "DESTINATION";
      else if (r.hotel) targetTypeStr = "HOTEL";
      else if (r.guide) targetTypeStr = "GUIDE";

      return {
        ...r,
        _id: r._id.toString(),
        targetType: targetTypeStr,
        user: r.user
          ? {
              _id: r.user._id ? r.user._id.toString() : String(r.user),
              name: r.user.name || "Anonymous User",
              email: r.user.email || "",
              profileImage: r.user.profileImage || "",
            }
          : null,
        destination: r.destination
          ? {
              ...r.destination,
              _id: r.destination._id ? r.destination._id.toString() : String(r.destination),
            }
          : null,
        hotel: r.hotel
          ? {
              ...r.hotel,
              _id: r.hotel._id ? r.hotel._id.toString() : String(r.hotel),
            }
          : null,
        guide: r.guide
          ? {
              ...r.guide,
              _id: r.guide._id ? r.guide._id.toString() : String(r.guide),
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      count: formattedReviews.length,
      total: filteredTotal,
      page,
      totalPages: Math.ceil(filteredTotal / limit) || 1,
      stats: {
        total: totalReviews,
        star5Count,
        star4Count,
        star3Count,
        star2Count,
        star1Count,
        destinationCount,
        hotelCount,
        guideCount,
      },
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error("GET /api/admin/reviews Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews.", details: error.message },
      { status: 500 }
    );
  }
}

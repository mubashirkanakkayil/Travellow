import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import Booking from "@/models/Booking";
import User from "@/models/User";
import Hotel from "@/models/Hotel";
import Guide from "@/models/Guide";
import Destination from "@/models/Destination";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/bookings
 * Fetch all platform bookings with pagination, search, role-based authorization,
 * filtering (type, status, destination), and safe user data projections.
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
    const bookingType = searchParams.get("bookingType")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const destinationId = searchParams.get("destination")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const sort = searchParams.get("sort") || "newest";

    const query = {};

    // Filter by Booking Type
    if (["HOTEL", "GUIDE"].includes(bookingType.toUpperCase())) {
      query.bookingType = bookingType.toUpperCase();
    }

    // Filter by Status
    if (["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].includes(status.toUpperCase())) {
      query.status = status.toUpperCase();
    }

    // Filter by Destination ObjectId
    if (destinationId && mongoose.Types.ObjectId.isValid(destinationId)) {
      query.destination = destinationId;
    }

    // Server-side search logic across user, hotel, guide, destination
    if (search) {
      const searchRegex = new RegExp(search, "i");

      // Find matching user IDs
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select("_id").lean();
      const matchingUserIds = matchingUsers.map((u) => u._id);

      // Find matching hotel IDs
      const matchingHotels = await Hotel.find({ name: searchRegex }).select("_id").lean();
      const matchingHotelIds = matchingHotels.map((h) => h._id);

      // Find matching guide IDs
      const matchingGuides = await Guide.find({ name: searchRegex }).select("_id").lean();
      const matchingGuideIds = matchingGuides.map((g) => g._id);

      // Find matching destination IDs
      const matchingDestinations = await Destination.find({
        $or: [{ name: searchRegex }, { country: searchRegex }],
      }).select("_id").lean();
      const matchingDestIds = matchingDestinations.map((d) => d._id);

      query.$or = [
        { user: { $in: matchingUserIds } },
        { hotel: { $in: matchingHotelIds } },
        { guide: { $in: matchingGuideIds } },
        { destination: { $in: matchingDestIds } },
      ];
    }

    // Sorting options
    let sortOptions = { createdAt: -1 };
    if (sort === "oldest") sortOptions = { createdAt: 1 };
    if (sort === "amount-high") sortOptions = { totalAmount: -1 };
    if (sort === "amount-low") sortOptions = { totalAmount: 1 };

    // Calculate real MongoDB statistics in parallel
    const [
      totalBookings,
      pendingCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      hotelCount,
      guideCount,
      filteredTotal,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: "PENDING" }),
      Booking.countDocuments({ status: "CONFIRMED" }),
      Booking.countDocuments({ status: "COMPLETED" }),
      Booking.countDocuments({ status: "CANCELLED" }),
      Booking.countDocuments({ bookingType: "HOTEL" }),
      Booking.countDocuments({ bookingType: "GUIDE" }),
      Booking.countDocuments(query),
    ]);

    const skip = (page - 1) * limit;

    // Fetch booking records with populated safe fields (strictly excluding password/hash/tokens)
    const bookings = await Booking.find(query)
      .populate("user", "name email phone country profileImage")
      .populate("hotel", "name image pricePerNight currency address")
      .populate("guide", "name profileImage hourlyRate currency languages")
      .populate("destination", "name country region slug image")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedBookings = bookings.map((b) => ({
      ...b,
      _id: b._id.toString(),
      user: b.user
        ? {
            _id: b.user._id ? b.user._id.toString() : String(b.user),
            name: b.user.name || "Guest User",
            email: b.user.email || "",
            phone: b.user.phone || "",
            country: b.user.country || "",
            profileImage: b.user.profileImage || "",
          }
        : null,
      hotel: b.hotel
        ? {
            ...b.hotel,
            _id: b.hotel._id ? b.hotel._id.toString() : String(b.hotel),
          }
        : null,
      guide: b.guide
        ? {
            ...b.guide,
            _id: b.guide._id ? b.guide._id.toString() : String(b.guide),
          }
        : null,
      destination: b.destination
        ? {
            ...b.destination,
            _id: b.destination._id ? b.destination._id.toString() : String(b.destination),
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      count: formattedBookings.length,
      total: filteredTotal,
      page,
      totalPages: Math.ceil(filteredTotal / limit) || 1,
      stats: {
        total: totalBookings,
        pendingCount,
        confirmedCount,
        completedCount,
        cancelledCount,
        hotelCount,
        guideCount,
      },
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error("GET /api/admin/bookings Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings.", details: error.message },
      { status: 500 }
    );
  }
}

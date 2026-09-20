import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/models/User";
import Destination from "@/models/Destination";
import Hotel from "@/models/Hotel";
import Guide from "@/models/Guide";
import Booking from "@/models/Booking";
import Review from "@/models/Review";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // 1. Server-side authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    // 2. Server-side role authorization (ADMIN role only)
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    // 3. Connect to database
    await connectToDatabase();

    // 4. Query real database counts using countDocuments()
    const [
      usersCount,
      destinationsCount,
      hotelsCount,
      guidesCount,
      bookingsCount,
      reviewsCount,
    ] = await Promise.all([
      User.countDocuments(),
      Destination.countDocuments(),
      Hotel.countDocuments(),
      Guide.countDocuments(),
      Booking.countDocuments(),
      Review.countDocuments(),
    ]);

    // 5. Fetch recent 5 bookings with populated targets
    const rawBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email")
      .populate("destination", "name")
      .populate("hotel", "name")
      .populate("guide", "name")
      .lean();

    const recentBookings = rawBookings.map((b) => ({
      _id: b._id.toString(),
      userName: b.user?.name || "Guest User",
      userEmail: b.user?.email || "",
      bookingType: b.bookingType,
      targetName:
        b.bookingType === "HOTEL"
          ? b.hotel?.name || "Hotel Stay"
          : b.guide?.name || "Local Guide",
      destinationName: b.destination?.name || "",
      startDate: b.startDate,
      totalAmount: b.totalAmount,
      currency: b.currency || "INR",
      status: b.status || "CONFIRMED",
      createdAt: b.createdAt,
    }));

    // 6. Fetch recent 5 reviews with populated targets
    const rawReviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name profileImage")
      .populate("destination", "name")
      .populate("hotel", "name")
      .populate("guide", "name")
      .lean();

    const recentReviews = rawReviews.map((r) => {
      let targetName = "General";
      let targetType = "Destination";

      if (r.destination?.name) {
        targetName = r.destination.name;
        targetType = "Destination";
      } else if (r.hotel?.name) {
        targetName = r.hotel.name;
        targetType = "Hotel";
      } else if (r.guide?.name) {
        targetName = r.guide.name;
        targetType = "Guide";
      }

      return {
        _id: r._id.toString(),
        userName: r.user?.name || "Anonymous",
        userProfileImage: r.user?.profileImage || "",
        targetName,
        targetType,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      };
    });

    // 7. Return safe summary response
    return NextResponse.json({
      success: true,
      stats: {
        users: usersCount,
        destinations: destinationsCount,
        hotels: hotelsCount,
        guides: guidesCount,
        bookings: bookingsCount,
        reviews: reviewsCount,
      },
      recentBookings,
      recentReviews,
    });
  } catch (error) {
    console.error("GET /api/admin/stats Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin statistics." },
      { status: 500 }
    );
  }
}

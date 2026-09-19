import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import Booking from "@/models/Booking";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * PATCH /api/bookings/[id]
 * Cancel a user's own booking
 */
export async function PATCH(request, { params }) {
  try {
    // 1. Authenticate user from session
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required to modify a booking." },
        { status: 401 }
      );
    }

    const bookingId = params.id;

    // 2. Validate booking ID format
    if (!bookingId || !OBJECT_ID_REGEX.test(bookingId)) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 3. Find booking strictly by ID AND authenticated user ID
    const booking = await Booking.findOne({ _id: bookingId, user: user.id });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found or unauthorized to modify." },
        { status: 404 }
      );
    }

    // 4. Validate current status before cancellation
    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, message: "Booking is already cancelled." },
        { status: 400 }
      );
    }

    if (booking.status === "COMPLETED") {
      return NextResponse.json(
        { success: false, message: "Completed bookings cannot be cancelled." },
        { status: 400 }
      );
    }

    // 5. Update status strictly to CANCELLED
    booking.status = "CANCELLED";
    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully.",
      data: booking,
    });
  } catch (error) {
    console.error("PATCH /api/bookings/[id] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to cancel booking. Please try again." },
      { status: 500 }
    );
  }
}

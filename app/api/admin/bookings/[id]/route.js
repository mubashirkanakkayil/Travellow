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

const ALLOWED_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

// Sensible status transition map
const VALID_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [], // Terminal state
  COMPLETED: [], // Terminal state
};

/**
 * GET /api/admin/bookings/[id]
 * Fetch single booking details with populated safe targets (excluding password/hash).
 */
export async function GET(request, context) {
  try {
    const params = context?.params ? await context.params : {};
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Booking ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const booking = await Booking.findById(id)
      .populate("user", "name email phone country profileImage")
      .populate("hotel", "name image pricePerNight currency address description")
      .populate("guide", "name profileImage hourlyRate currency languages specialties")
      .populate("destination", "name country region slug image description")
      .lean();

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        _id: booking._id.toString(),
        user: booking.user
          ? {
              _id: booking.user._id ? booking.user._id.toString() : String(booking.user),
              name: booking.user.name || "Guest User",
              email: booking.user.email || "",
              phone: booking.user.phone || "",
              country: booking.user.country || "",
              profileImage: booking.user.profileImage || "",
            }
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/bookings/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch booking details.", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/bookings/[id]
 * Safely update booking status while preserving historical financial data (totalAmount, currency, etc.).
 * Enforces server-side status transition validation rules.
 */
export async function PATCH(request, context) {
  try {
    const params = context?.params ? await context.params : {};
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Booking ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    // 1. Check if client attempts to modify financial/core fields
    const restrictedFields = ["totalAmount", "currency", "user", "hotel", "guide", "destination", "bookingType", "createdAt"];
    const attemptedRestrictedField = restrictedFields.find((f) => body[f] !== undefined);
    if (attemptedRestrictedField) {
      return NextResponse.json(
        {
          success: false,
          error: `Modifying historical financial or core reference field '${attemptedRestrictedField}' is prohibited. Financial records must remain intact.`,
        },
        { status: 400 }
      );
    }

    const { status } = body;

    // 2. Validate Status Parameter
    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status field is required for booking updates." },
        { status: 400 }
      );
    }

    const upperStatus = String(status).toUpperCase().trim();
    if (!ALLOWED_STATUSES.includes(upperStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status '${status}'. Must be one of: PENDING, CONFIRMED, COMPLETED, CANCELLED.`,
        },
        { status: 400 }
      );
    }

    const currentStatus = booking.status;

    // If status is unchanged, return current state
    if (currentStatus === upperStatus) {
      const populated = await Booking.findById(id)
        .populate("user", "name email phone country profileImage")
        .populate("hotel", "name image pricePerNight currency address")
        .populate("guide", "name profileImage hourlyRate currency")
        .populate("destination", "name country region slug")
        .lean();

      return NextResponse.json({
        success: true,
        message: `Booking status is already ${upperStatus}.`,
        booking: { ...populated, _id: populated._id.toString() },
      });
    }

    // 3. Enforce Server-Side Status Transition Validation
    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(upperStatus)) {
      let reason = `Cannot transition booking from ${currentStatus} to ${upperStatus}.`;
      if (currentStatus === "CANCELLED") {
        reason = "Cannot change a cancelled booking to confirmed or completed.";
      } else if (currentStatus === "COMPLETED") {
        reason = "Completed bookings cannot be modified.";
      }

      return NextResponse.json(
        {
          success: false,
          error: reason,
          currentStatus,
          allowedStatuses: allowedNextStatuses,
        },
        { status: 400 }
      );
    }

    // Update status safely
    booking.status = upperStatus;
    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("user", "name email phone country profileImage")
      .populate("hotel", "name image pricePerNight currency address")
      .populate("guide", "name profileImage hourlyRate currency")
      .populate("destination", "name country region slug")
      .lean();

    return NextResponse.json({
      success: true,
      message: `Booking status successfully updated to ${upperStatus}.`,
      booking: {
        ...updatedBooking,
        _id: updatedBooking._id.toString(),
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/bookings/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking status.", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/bookings/[id]
 * Deletion is intentionally disabled to preserve historical financial and platform activity records.
 */
export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Deletion of booking records is disabled to preserve historical financial and platform activity data.",
    },
    { status: 409 }
  );
}

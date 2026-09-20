import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import User from "@/models/User";
import Booking from "@/models/Booking";
import Review from "@/models/Review";
import AIChat from "@/models/AIChat";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["USER", "ADMIN", "LOCAL_GUIDE"];
const ALLOWED_CURRENCIES = ["INR", "USD", "AED", "EUR", "GBP", "JPY"];

/**
 * GET /api/admin/users/[id]
 * Fetch safe user details and associated activity metrics (Bookings, Reviews, AI Chats).
 * Excludes password field (-password).
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
        { success: false, error: "Invalid User ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const targetUser = await User.findById(id).select("-password").lean();
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    // Compute activity metrics safely
    const [bookingCount, reviewCount, aiChatCount] = await Promise.all([
      Booking.countDocuments({ user: id }),
      Review.countDocuments({ user: id }),
      AIChat.countDocuments({ user: id }),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        ...targetUser,
        _id: targetUser._id.toString(),
      },
      stats: {
        bookingCount,
        reviewCount,
        aiChatCount,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/users/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user details.", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Safely update user role or safe profile fields.
 * Includes server-side self-demotion protection and last-admin protection.
 * Password fields are strictly ignored.
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
        { success: false, error: "Invalid User ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    const { role, name, phone, country, preferredCurrency, profileImage } = body;

    // Handle Role Update with Strict Safeguards
    if (role !== undefined) {
      const upperRole = String(role).toUpperCase().trim();
      if (!ALLOWED_ROLES.includes(upperRole)) {
        return NextResponse.json(
          { success: false, error: "Invalid role specified. Must be USER, LOCAL_GUIDE, or ADMIN." },
          { status: 400 }
        );
      }

      // Safeguard 1: Self-Demotion Protection
      if (currentUser.id === id && upperRole !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "You cannot remove your own admin access." },
          { status: 403 }
        );
      }

      // Safeguard 2: Last Admin Protection
      if (targetUser.role === "ADMIN" && upperRole !== "ADMIN") {
        const totalAdmins = await User.countDocuments({ role: "ADMIN" });
        if (totalAdmins <= 1) {
          return NextResponse.json(
            { success: false, error: "At least one administrator account must remain on the platform." },
            { status: 409 }
          );
        }
      }

      targetUser.role = upperRole;
    }

    // Handle Safe Profile Field Updates
    if (name !== undefined && typeof name === "string" && name.trim()) {
      targetUser.name = name.trim();
    }
    if (phone !== undefined && typeof phone === "string") {
      targetUser.phone = phone.trim();
    }
    if (country !== undefined && typeof country === "string" && country.trim()) {
      targetUser.country = country.trim();
    }
    if (preferredCurrency !== undefined && ALLOWED_CURRENCIES.includes(preferredCurrency?.toUpperCase())) {
      targetUser.preferredCurrency = preferredCurrency.toUpperCase();
    }
    if (profileImage !== undefined && typeof profileImage === "string") {
      targetUser.profileImage = profileImage.trim();
    }

    // Save updated user record (password remains untouched)
    await targetUser.save();

    const updatedUser = await User.findById(id).select("-password").lean();

    return NextResponse.json({
      success: true,
      message: "User account updated successfully.",
      user: {
        ...updatedUser,
        _id: updatedUser._id.toString(),
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/users/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user account.", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Hard deletion is intentionally disabled to preserve booking, review, and AI chat historical data.
 */
export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Hard deletion of user accounts is disabled to preserve booking, review, and AI chat historical data.",
    },
    { status: 409 }
  );
}

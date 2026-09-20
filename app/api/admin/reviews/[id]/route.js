import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import Review from "@/models/Review";
import User from "@/models/User";
import Destination from "@/models/Destination";
import Hotel from "@/models/Hotel";
import Guide from "@/models/Guide";
import { updateTargetRating } from "@/lib/reviews/recalculateRating";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reviews/[id]
 * Fetch single review details with populated safe targets (excluding user password).
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
        { success: false, error: "Invalid Review ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const review = await Review.findById(id)
      .populate("user", "name email profileImage")
      .populate("destination", "name country region slug image")
      .populate("hotel", "name image pricePerNight currency destination")
      .populate("guide", "name profileImage hourlyRate currency destination")
      .lean();

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found." },
        { status: 404 }
      );
    }

    let targetTypeStr = "UNKNOWN";
    if (review.destination) targetTypeStr = "DESTINATION";
    else if (review.hotel) targetTypeStr = "HOTEL";
    else if (review.guide) targetTypeStr = "GUIDE";

    return NextResponse.json({
      success: true,
      review: {
        ...review,
        _id: review._id.toString(),
        targetType: targetTypeStr,
        user: review.user
          ? {
              _id: review.user._id ? review.user._id.toString() : String(review.user),
              name: review.user.name || "Anonymous User",
              email: review.user.email || "",
              profileImage: review.user.profileImage || "",
            }
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/reviews/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch review details.", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/reviews/[id]
 * Allows ADMIN to edit rating (1-5) and comment (3-1000 chars).
 * Protected target relationships (user, destination, hotel, guide) cannot be changed.
 * Automatically recalculates target aggregate rating & reviewCount.
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
        { success: false, error: "Invalid Review ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    // 1. Block attempts to alter protected relationships
    const protectedFields = ["user", "destination", "hotel", "guide", "targetType"];
    const attemptedProtectedField = protectedFields.find((f) => body[f] !== undefined);
    if (attemptedProtectedField) {
      return NextResponse.json(
        {
          success: false,
          error: `Modifying protected review relationship field '${attemptedProtectedField}' is prohibited. Reviews cannot be reassigned to a different target or user.`,
        },
        { status: 400 }
      );
    }

    const { rating, comment } = body;

    // 2. Validate Rating (must be integer 1 to 5)
    if (rating !== undefined) {
      if (
        rating === null ||
        typeof rating !== "number" ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        return NextResponse.json(
          { success: false, error: "Rating must be an integer between 1 and 5." },
          { status: 400 }
        );
      }
      review.rating = rating;
    }

    // 3. Validate Comment (string 3 to 1000 characters)
    if (comment !== undefined) {
      if (typeof comment !== "string") {
        return NextResponse.json(
          { success: false, error: "Comment must be a text string." },
          { status: 400 }
        );
      }
      const trimmedComment = comment.trim();
      if (trimmedComment.length < 3 || trimmedComment.length > 1000) {
        return NextResponse.json(
          { success: false, error: "Comment must be between 3 and 1000 characters." },
          { status: 400 }
        );
      }
      review.comment = trimmedComment;
    }

    await review.save();

    // 4. Identify Target Entity & Recalculate Aggregates
    const targetField = review.destination
      ? "destination"
      : review.hotel
      ? "hotel"
      : review.guide
      ? "guide"
      : "";
    const targetId = targetField ? review[targetField] : null;

    let targetStats = { rating: 0, reviewCount: 0 };
    if (targetField && targetId) {
      targetStats = await updateTargetRating(targetField, targetId);
    }

    const updatedReview = await Review.findById(id)
      .populate("user", "name email profileImage")
      .populate("destination", "name country region slug")
      .populate("hotel", "name image pricePerNight currency")
      .populate("guide", "name profileImage hourlyRate currency")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Review updated successfully.",
      review: {
        ...updatedReview,
        _id: updatedReview._id.toString(),
      },
      targetStats,
    });
  } catch (error) {
    console.error("PATCH /api/admin/reviews/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update review.", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/reviews/[id]
 * Delete a review document and recalculate target entity rating & reviewCount.
 */
export async function DELETE(request, context) {
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
        { success: false, error: "Invalid Review ID format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found." },
        { status: 404 }
      );
    }

    // Determine target entity before deletion
    const targetField = review.destination
      ? "destination"
      : review.hotel
      ? "hotel"
      : review.guide
      ? "guide"
      : "";
    const targetId = targetField ? review[targetField] : null;

    // Delete review document
    await review.deleteOne();

    // Recalculate target aggregate rating & reviewCount
    let targetStats = { rating: 0, reviewCount: 0 };
    if (targetField && targetId) {
      targetStats = await updateTargetRating(targetField, targetId);
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully.",
      targetField,
      targetId: targetId ? targetId.toString() : null,
      rating: targetStats.rating,
      reviewCount: targetStats.reviewCount,
    });
  } catch (error) {
    console.error("DELETE /api/admin/reviews/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete review.", details: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import Review from "@/models/Review";
import Destination from "@/models/Destination";
import Hotel from "@/models/Hotel";
import Guide from "@/models/Guide";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

import { updateTargetRating } from "@/lib/reviews/recalculateRating";

/**
 * PATCH /api/reviews/[id]
 * Allows review owner or ADMIN to edit rating and comment.
 */
export async function PATCH(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid review ID." },
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

    // Check authorization: Owner or ADMIN only
    const isOwner = review.user.toString() === currentUser.id;
    const isAdmin = currentUser.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to edit this review." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body;

    // Revalidate rating if provided
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

    // Revalidate comment if provided
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

    // Determine target entity for aggregation
    const targetField = review.destination
      ? "destination"
      : review.hotel
      ? "hotel"
      : "guide";
    const targetId = review[targetField];

    await updateTargetRating(targetField, targetId);

    const populatedReview = await Review.findById(review._id)
      .populate("user", "name profileImage")
      .lean();

    return NextResponse.json({
      success: true,
      review: {
        _id: populatedReview._id.toString(),
        rating: populatedReview.rating,
        comment: populatedReview.comment,
        [targetField]: targetId ? targetId.toString() : undefined,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          profileImage: currentUser.profileImage || "",
        },
        createdAt: populatedReview.createdAt,
        updatedAt: populatedReview.updatedAt,
      },
    });
  } catch (error) {
    console.error("PATCH /api/reviews/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update review." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[id]
 * Allows review owner or ADMIN to delete a review.
 */
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid review ID." },
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

    // Check authorization: Owner or ADMIN only
    const isOwner = review.user.toString() === currentUser.id;
    const isAdmin = currentUser.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not authorized to delete this review." },
        { status: 403 }
      );
    }

    const targetField = review.destination
      ? "destination"
      : review.hotel
      ? "hotel"
      : "guide";
    const targetId = review[targetField];

    await review.deleteOne();

    // Recalculate rating aggregation
    if (targetField && targetId) {
      await updateTargetRating(targetField, targetId);
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/reviews/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete review." },
      { status: 500 }
    );
  }
}

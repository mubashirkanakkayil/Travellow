import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import Review from "@/models/Review";
import Destination from "@/models/Destination";
import Hotel from "@/models/Hotel";
import Guide from "@/models/Guide";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

import { updateTargetRating } from "@/lib/reviews/recalculateRating";

/**
 * GET /api/reviews
 * Filter by exactly ONE target: ?destination=ID or ?hotel=ID or ?guide=ID
 */
export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const destinationId = searchParams.get("destination");
    const hotelId = searchParams.get("hotel");
    const guideId = searchParams.get("guide");

    // Check that exactly one filter param is supplied
    const filters = [destinationId, hotelId, guideId].filter(Boolean);
    if (filters.length !== 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Must filter by exactly one target: destination, hotel, or guide.",
        },
        { status: 400 }
      );
    }

    let targetField = "";
    let targetId = "";

    if (destinationId) {
      targetField = "destination";
      targetId = destinationId;
    } else if (hotelId) {
      targetField = "hotel";
      targetId = hotelId;
    } else if (guideId) {
      targetField = "guide";
      targetId = guideId;
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json(
        { success: false, error: "Invalid target ID format." },
        { status: 400 }
      );
    }

    const reviews = await Review.find({ [targetField]: targetId })
      .sort({ createdAt: -1 })
      .populate("user", "name profileImage")
      .lean();

    // Sanitize output to remove internal or secret fields
    const sanitizedReviews = reviews.map((r) => ({
      _id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      destination: r.destination ? r.destination.toString() : undefined,
      hotel: r.hotel ? r.hotel.toString() : undefined,
      guide: r.guide ? r.guide.toString() : undefined,
      user: r.user
        ? {
            id: r.user._id ? r.user._id.toString() : "",
            name: r.user.name || "Anonymous",
            profileImage: r.user.profileImage || "",
          }
        : { name: "Anonymous", profileImage: "" },
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      count: sanitizedReviews.length,
      reviews: sanitizedReviews,
    });
  } catch (error) {
    console.error("GET /api/reviews Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Requires authentication. Creates a review for destination, hotel, or guide.
 */
export async function POST(request) {
  try {
    // 1. Authenticate user via session
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // 2. Parse request body
    const body = await request.json();
    const { destinationId, hotelId, guideId, rating, comment } = body;

    // 3. Validate exactly one target
    const targetIds = [destinationId, hotelId, guideId].filter(Boolean);
    if (targetIds.length !== 1) {
      return NextResponse.json(
        {
          success: false,
          error: "A review must belong to exactly one target: destination, hotel, or guide.",
        },
        { status: 400 }
      );
    }

    let targetField = "";
    let targetId = "";
    let TargetModel;

    if (destinationId) {
      targetField = "destination";
      targetId = destinationId;
      TargetModel = Destination;
    } else if (hotelId) {
      targetField = "hotel";
      targetId = hotelId;
      TargetModel = Hotel;
    } else if (guideId) {
      targetField = "guide";
      targetId = guideId;
      TargetModel = Guide;
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json(
        { success: false, error: "Invalid target ID format." },
        { status: 400 }
      );
    }

    // 4. Verify Target Exists
    const targetDoc = await TargetModel.findById(targetId).lean();
    if (!targetDoc) {
      const entityName = targetField.charAt(0).toUpperCase() + targetField.slice(1);
      return NextResponse.json(
        { success: false, error: `${entityName} not found.` },
        { status: 404 }
      );
    }

    // 5. Validate Rating (must be strict integer between 1 and 5)
    if (
      rating === null ||
      rating === undefined ||
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Rating must be an integer between 1 and 5.",
        },
        { status: 400 }
      );
    }

    // 6. Validate Comment (string, 3 to 1000 characters after trimming)
    if (typeof comment !== "string") {
      return NextResponse.json(
        { success: false, error: "Comment must be a text string." },
        { status: 400 }
      );
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 3 || trimmedComment.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: "Comment must be between 3 and 1000 characters.",
        },
        { status: 400 }
      );
    }

    // 7. Duplicate Review Protection (One review per user per target)
    const existingReview = await Review.findOne({
      user: currentUser.id,
      [targetField]: targetId,
    }).lean();

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this item." },
        { status: 409 }
      );
    }

    // 8. Create Review
    const newReview = await Review.create({
      user: currentUser.id,
      [targetField]: targetId,
      rating,
      comment: trimmedComment,
    });

    // 9. Recalculate and update Target Rating & ReviewCount
    await updateTargetRating(targetField, targetId);

    // Populate user info for response
    const populatedReview = await Review.findById(newReview._id)
      .populate("user", "name profileImage")
      .lean();

    return NextResponse.json(
      {
        success: true,
        review: {
          _id: populatedReview._id.toString(),
          rating: populatedReview.rating,
          comment: populatedReview.comment,
          [targetField]: targetId,
          user: {
            id: currentUser.id,
            name: currentUser.name,
            profileImage: currentUser.profileImage || "",
          },
          createdAt: populatedReview.createdAt,
          updatedAt: populatedReview.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reviews Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit review." },
      { status: 500 }
    );
  }
}

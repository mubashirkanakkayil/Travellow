import Review from "@/models/Review";
import Destination from "@/models/Destination";
import Hotel from "@/models/Hotel";
import Guide from "@/models/Guide";

/**
 * Shared helper to recalculate average rating and review count from the Review collection
 * and update the target document (Destination, Hotel, or Guide) in MongoDB.
 *
 * @param {string} targetField - "destination", "hotel", or "guide"
 * @param {string|ObjectId} targetId - The target ObjectId
 * @returns {Promise<{ rating: number, reviewCount: number }>}
 */
export async function updateTargetRating(targetField, targetId) {
  if (!targetField || !targetId) {
    return { rating: 0, reviewCount: 0 };
  }

  const reviews = await Review.find({ [targetField]: targetId }).lean();
  const reviewCount = reviews.length;

  let averageRating = 0;
  if (reviewCount > 0) {
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    averageRating = Math.round((sum / reviewCount) * 100) / 100;
  } else {
    averageRating = 0;
  }

  let Model;
  if (targetField === "destination") Model = Destination;
  else if (targetField === "hotel") Model = Hotel;
  else if (targetField === "guide") Model = Guide;

  if (Model) {
    await Model.findByIdAndUpdate(targetId, {
      rating: averageRating,
      reviewCount: reviewCount,
    });
  }

  return { rating: averageRating, reviewCount };
}

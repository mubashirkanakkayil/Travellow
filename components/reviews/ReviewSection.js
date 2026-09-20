"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Edit2,
  Trash2,
  User,
  LogIn,
  Send,
  X,
  Sparkles,
} from "lucide-react";

import StarRating from "./StarRating";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import AuthPromptModal from "@/components/bookings/AuthPromptModal";

/**
 * Format date into relative or formatted string (e.g. "2 days ago" or "Sep 20, 2026")
 */
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReviewSection({
  targetType = "destination", // "destination" | "hotel" | "guide"
  targetId = "",
  targetName = "",
  initialRating = 4.8,
  initialReviewCount = 0,
  className = "",
}) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User session state
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  // New review form state
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Edit review state
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete review loading state
  const [deletingId, setDeletingId] = useState(null);

  // 1. Fetch current user session
  useEffect(() => {
    async function checkAuth() {
      try {
        setIsAuthLoading(true);
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        setCurrentUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Fetch reviews for target
  const fetchReviews = async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/reviews?${targetType}=${targetId}`);
      const data = await res.json();

      if (data.success) {
        setReviews(data.reviews || []);
      } else {
        setError(data.error || "Unable to load reviews.");
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [targetType, targetId]);

  // Calculated rating metrics
  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviewCount).toFixed(1)
      : Number(initialRating || 4.8).toFixed(1);

  // Handle new review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!currentUser) {
      setIsAuthPromptOpen(true);
      return;
    }

    if (newRating < 1 || newRating > 5) {
      setSubmitError("Please select a star rating between 1 and 5 stars.");
      return;
    }

    const trimmed = newComment.trim();
    if (trimmed.length < 3) {
      setSubmitError("Comment must be at least 3 characters long.");
      return;
    }

    if (trimmed.length > 1000) {
      setSubmitError("Comment cannot exceed 1000 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        [`${targetType}Id`]: targetId,
        rating: newRating,
        comment: trimmed,
      };

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitSuccess("Thank you! Your review has been submitted successfully.");
        setNewRating(0);
        setNewComment("");
        // Re-fetch reviews to display updated list
        await fetchReviews();
      } else if (res.status === 409) {
        setSubmitError(data.error || "You have already reviewed this item.");
      } else {
        setSubmitError(data.error || "Failed to submit review. Please try again.");
      }
    } catch (err) {
      console.error("Submit review error:", err);
      setSubmitError("Failed to submit review. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle initiating edit
  const startEdit = (review) => {
    setEditingReviewId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingReviewId(null);
    setEditError(null);
  };

  // Handle submitting review edit (PATCH)
  const handleSaveEdit = async (reviewId) => {
    setEditError(null);

    if (editRating < 1 || editRating > 5) {
      setEditError("Rating must be between 1 and 5 stars.");
      return;
    }

    const trimmed = editComment.trim();
    if (trimmed.length < 3 || trimmed.length > 1000) {
      setEditError("Comment must be between 3 and 1000 characters.");
      return;
    }

    try {
      setEditSubmitting(true);
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: editRating, comment: trimmed }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEditingReviewId(null);
        await fetchReviews();
      } else {
        setEditError(data.error || "Failed to update review.");
      }
    } catch (err) {
      setEditError("Failed to update review.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle deleting review (DELETE)
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      setDeletingId(reviewId);
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await fetchReviews();
      } else {
        alert(data.error || "Failed to delete review.");
      }
    } catch (err) {
      alert("Failed to delete review.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={`space-y-10 py-6 ${className}`}>
      
      {/* SECTION HEADER & SUMMARY */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-borderLine shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-coral-500 uppercase tracking-widest">
            <MessageSquare size={16} />
            <span>Community Reviews</span>
          </div>
          <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-primaryText tracking-tight">
            Guest Experiences {targetName ? `for ${targetName}` : ""}
          </h3>
          <p className="text-xs sm:text-sm text-bodyText max-w-lg">
            Read verified traveler feedback or share your authentic experience with the Travellow community.
          </p>
        </div>

        {/* Rating Summary Box */}
        <div className="bg-secondaryBg/80 p-5 rounded-2xl border border-borderLine/80 flex items-center gap-4 shrink-0">
          <div className="text-center font-display font-extrabold text-4xl text-primaryText">
            {avgRating}
          </div>
          <div className="space-y-1 border-l border-borderLine pl-4">
            <StarRating rating={Math.round(Number(avgRating))} size={18} />
            <span className="text-xs font-semibold text-mutedText block">
              {reviewCount > 0 ? `Based on ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}` : "No reviews yet"}
            </span>
          </div>
        </div>
      </div>

      {/* WRITE REVIEW FORM */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-borderLine shadow-md space-y-5">
        <div className="flex items-center justify-between border-b border-borderLine pb-4">
          <h4 className="font-display font-bold text-lg text-primaryText flex items-center gap-2">
            <Sparkles size={18} className="text-coral-500" />
            Share Your Experience
          </h4>
          {currentUser && (
            <span className="text-xs text-mutedText">
              Posting as <strong className="text-primaryText">{currentUser.name}</strong>
            </span>
          )}
        </div>

        {currentUser ? (
          <form onSubmit={handleSubmitReview} className="space-y-5">
            {/* Star Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-primaryText uppercase tracking-wider block">
                Your Rating <span className="text-coral-500">*</span>
              </label>
              <div className="flex items-center gap-3 bg-secondaryBg p-3 rounded-2xl border border-borderLine inline-flex">
                <StarRating
                  rating={newRating}
                  interactive={true}
                  size={24}
                  onRatingChange={(r) => setNewRating(r)}
                />
                <span className="text-xs font-semibold text-coral-600">
                  {newRating > 0 ? `${newRating} / 5 Stars` : "Select stars"}
                </span>
              </div>
            </div>

            {/* Comment Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-primaryText uppercase tracking-wider block">
                Your Review <span className="text-coral-500">*</span>
              </label>
              <textarea
                rows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Tell us about your experience, highlights, or tips for fellow travelers..."
                className="w-full p-4 rounded-2xl bg-secondaryBg/50 border border-borderLine text-sm text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50 focus:bg-white transition-all placeholder:text-mutedText resize-y min-h-[100px]"
              />
              <div className="flex justify-between text-[11px] text-mutedText px-1">
                <span>Minimum 3 characters</span>
                <span>{newComment.length} / 1000 characters</span>
              </div>
            </div>

            {/* Error & Success Messages */}
            {submitError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Review</span>
                </>
              )}
            </Button>
          </form>
        ) : (
          /* Logged-Out Prompt */
          <div className="p-6 sm:p-8 rounded-2xl bg-secondaryBg text-center space-y-4 border border-borderLine/80">
            <div className="w-12 h-12 rounded-full bg-coral-50 text-coral-500 flex items-center justify-center mx-auto">
              <LogIn size={24} />
            </div>
            <div className="space-y-1">
              <h5 className="font-display font-bold text-base text-primaryText">
                Want to share your experience?
              </h5>
              <p className="text-xs text-mutedText max-w-sm mx-auto">
                Sign in to your Travellow account to rate and review this destination.
              </p>
            </div>
            <Button
              variant="softCoral"
              size="sm"
              onClick={() => setIsAuthPromptOpen(true)}
              className="gap-2"
            >
              <LogIn size={15} />
              <span>Sign In to Review</span>
            </Button>
          </div>
        )}
      </div>

      {/* REVIEWS LIST SECTION */}
      <div className="space-y-6">
        <h4 className="font-display font-bold text-xl text-primaryText flex items-center gap-2">
          <span>All Reviews</span>
          <Badge variant="secondary" className="text-xs">
            {reviewCount}
          </Badge>
        </h4>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-6 rounded-3xl bg-white border border-borderLine space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-2/3 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 rounded-3xl bg-secondaryBg border border-borderLine text-center space-y-3">
            <AlertCircle size={32} className="text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-primaryText">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchReviews}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && reviews.length === 0 && (
          <div className="p-8 sm:p-12 rounded-3xl bg-secondaryBg border border-borderLine text-center space-y-3">
            <MessageSquare size={36} className="text-mutedText mx-auto" />
            <h5 className="font-display font-bold text-base text-primaryText">
              No reviews yet
            </h5>
            <p className="text-xs text-mutedText max-w-sm mx-auto">
              Be the first to share your experience and guide fellow travelers!
            </p>
          </div>
        )}

        {/* Review Cards Grid */}
        {!loading && !error && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const isOwner = currentUser && (currentUser.id === rev.user?.id || currentUser.id === rev.user?._id);
              const isAdmin = currentUser && currentUser.role === "ADMIN";
              const canModify = isOwner || isAdmin;
              const isEditingThis = editingReviewId === rev._id;

              return (
                <div
                  key={rev._id}
                  className="bg-white p-6 rounded-3xl border border-borderLine shadow-sm space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Card Top Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {rev.user?.profileImage ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-borderLine">
                          <Image
                            src={rev.user.profileImage}
                            alt={rev.user.name || "User"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-coral-100 text-coral-600 font-bold text-sm flex items-center justify-center shrink-0">
                          {rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                      )}
                      <div>
                        <h5 className="font-display font-bold text-sm text-primaryText">
                          {rev.user?.name || "Anonymous Traveler"}
                        </h5>
                        <span className="text-[11px] text-mutedText block">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Owner / Admin Edit & Delete Actions */}
                    {canModify && !isEditingThis && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(rev)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-coral-500 hover:bg-slate-50 transition-colors"
                          title="Edit review"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev._id)}
                          disabled={deletingId === rev._id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-50 transition-colors"
                          title="Delete review"
                        >
                          {deletingId === rev._id ? (
                            <Loader2 size={15} className="animate-spin text-rose-500" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Rating & Comment View OR Edit Form */}
                  {isEditingThis ? (
                    /* Inline Edit Mode */
                    <div className="space-y-3 pt-2 bg-secondaryBg/60 p-4 rounded-2xl border border-borderLine">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primaryText">Edit Rating & Comment</span>
                        <button type="button" onClick={cancelEdit} className="text-slate-400 hover:text-slate-600">
                          <X size={16} />
                        </button>
                      </div>

                      <StarRating
                        rating={editRating}
                        interactive={true}
                        size={20}
                        onRatingChange={(r) => setEditRating(r)}
                      />

                      <textarea
                        rows={3}
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                      />

                      {editError && (
                        <p className="text-xs font-semibold text-rose-600">{editError}</p>
                      )}

                      <div className="flex gap-2 justify-end pt-1">
                        <Button variant="outline" size="sm" onClick={cancelEdit}>
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={editSubmitting}
                          onClick={() => handleSaveEdit(rev._id)}
                        >
                          {editSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Standard Read Mode */
                    <div className="space-y-2">
                      <StarRating rating={rev.rating} size={15} />
                      <p className="text-bodyText text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                        {rev.comment}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={isAuthPromptOpen}
        onClose={() => setIsAuthPromptOpen(false)}
      />

    </div>
  );
}

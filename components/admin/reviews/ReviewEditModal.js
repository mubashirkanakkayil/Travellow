"use client";

import React, { useState, useEffect } from "react";
import { X, Star, Edit2, AlertCircle, CheckCircle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function ReviewEditModal({ review, isOpen, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (review) {
      setRating(review.rating || 5);
      setComment(review.comment || "");
      setError("");
      setSuccessMsg("");
    }
  }, [review, isOpen]);

  if (!isOpen || !review) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    // Client-side validations
    if (!rating || rating < 1 || rating > 5) {
      setError("Rating must be an integer between 1 and 5.");
      setLoading(false);
      return;
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 3 || trimmedComment.length > 1000) {
      setError("Comment must be between 3 and 1000 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/reviews/${review._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: Number(rating),
          comment: trimmedComment,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update review.");
      }

      setSuccessMsg("Review updated and target rating recalculated successfully.");
      setTimeout(() => {
        onSuccess(data.review);
        onClose();
        setSuccessMsg("");
      }, 800);
    } catch (err) {
      setError(err.message || "An error occurred while updating the review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-borderLine shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-borderLine bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-coral-500/20 text-coral-400 flex items-center justify-center font-bold">
              <Edit2 size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Edit Review
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {review._id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Messages */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2.5">
              <CheckCircle size={16} className="shrink-0 text-teal-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Locked Target Notice */}
          <div className="p-3.5 rounded-2xl bg-secondaryBg border border-borderLine space-y-1">
            <span className="text-[10px] uppercase font-bold text-mutedText block">
              Reviewer & Target (Protected)
            </span>
            <div className="flex items-center justify-between text-xs font-semibold text-primaryText">
              <span>{review.user?.name || "User"}</span>
              <Badge variant="coral" className="text-[10px]">
                {review.targetType || "TARGET"}
              </Badge>
            </div>
          </div>

          {/* Rating Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-primaryText block uppercase tracking-wider">
              Rating (1 - 5 Stars)
            </label>

            <div className="flex items-center gap-2 p-3 bg-secondaryBg rounded-2xl border border-borderLine">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                >
                  <Star
                    size={26}
                    className={
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }
                  />
                </button>
              ))}
              <span className="ml-auto font-bold text-sm text-primaryText">
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          {/* Comment Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-primaryText block uppercase tracking-wider">
              Review Comment Content
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter review comment (3 to 1000 characters)..."
              className="w-full p-3 rounded-2xl border border-borderLine bg-white text-xs text-primaryText focus:outline-none focus:border-coral-500"
            />
            <div className="flex justify-between text-[11px] text-mutedText px-1">
              <span>Min 3, Max 1000 chars</span>
              <span>{comment.trim().length} chars</span>
            </div>
          </div>

          {/* Recalculation Notice */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
            Target average rating and review count will be recalculated automatically upon saving.
          </div>

          {/* ACTIONS */}
          <div className="pt-3 border-t border-borderLine flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={onClose} type="button" disabled={loading}>
              Cancel
            </Button>

            <Button variant="primary" type="submit" disabled={loading} loading={loading}>
              Save Changes
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  X,
  Star,
  User,
  MapPin,
  Hotel,
  Users,
  Calendar,
  Edit2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (err) {
    return "N/A";
  }
}

export default function ReviewDetailModal({
  review,
  isOpen,
  onClose,
  onOpenEditModal,
  onOpenDeleteModal,
}) {
  if (!isOpen || !review) return null;

  const isDestination = Boolean(review.destination);
  const isHotel = Boolean(review.hotel);
  const isGuide = Boolean(review.guide);

  let targetName = "Target unavailable";
  let targetSubtitle = "";

  if (isDestination && review.destination?.name) {
    targetName = review.destination.name;
    targetSubtitle = `${review.destination.country || "India"}${review.destination.region ? ` • ${review.destination.region}` : ""}`;
  } else if (isHotel && review.hotel?.name) {
    targetName = review.hotel.name;
    targetSubtitle = review.hotel.destination?.name ? `In ${review.hotel.destination.name}` : "Hotel Stay";
  } else if (isGuide && review.guide?.name) {
    targetName = review.guide.name;
    targetSubtitle = review.guide.destination?.name ? `Guide in ${review.guide.destination.name}` : "Local Guide";
  }

  const renderStars = (rating = 5) => {
    return (
      <div className="flex items-center gap-1 text-amber-400">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={16}
            className={s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
          />
        ))}
        <span className="ml-1.5 text-xs font-bold text-primaryText">
          {rating}.0
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-borderLine shadow-2xl overflow-hidden my-8 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-borderLine bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Star size={20} className="fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-white">
                  Review Details
                </h3>
                <Badge
                  variant={isDestination ? "teal" : isHotel ? "purple" : "coral"}
                  className="text-[10px]"
                >
                  {isDestination ? "DESTINATION" : isHotel ? "HOTEL" : isGuide ? "GUIDE" : "REVIEW"}
                </Badge>
              </div>
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

        {/* MODAL BODY */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* 1. REVIEWER INFO */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-coral-600 block">
              Reviewer Information
            </span>
            <div className="p-3.5 rounded-2xl bg-secondaryBg border border-borderLine flex items-center gap-3">
              {review.user?.profileImage ? (
                <img
                  src={review.user.profileImage}
                  alt={review.user.name || "User"}
                  className="w-11 h-11 rounded-2xl object-cover border border-borderLine shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-coral-500/10 text-coral-500 font-bold flex items-center justify-center shrink-0">
                  <User size={20} />
                </div>
              )}
              <div>
                <span className="font-bold text-sm text-primaryText block">
                  {review.user?.name || "Anonymous User"}
                </span>
                <span className="text-xs text-mutedText block">
                  {review.user?.email || "No email available"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. TARGET ENTITY */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-coral-600 block">
              Review Target
            </span>
            <div className="p-3.5 rounded-2xl bg-secondaryBg border border-borderLine flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-borderLine flex items-center justify-center text-slate-600">
                  {isDestination ? (
                    <MapPin size={18} className="text-teal-600" />
                  ) : isHotel ? (
                    <Hotel size={18} className="text-purple-600" />
                  ) : (
                    <Users size={18} className="text-coral-500" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm text-primaryText block">
                    {targetName}
                  </span>
                  <span className="text-xs text-mutedText block">
                    {targetSubtitle}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. RATING & COMMENT */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-borderLine space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-borderLine">
              <span className="text-xs font-semibold text-mutedText">Assigned Rating</span>
              {renderStars(review.rating)}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText block">
                Full Comment Content
              </span>
              <p className="text-xs text-primaryText leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-borderLine">
                "{review.comment}"
              </p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-[11px] text-mutedText px-1">
            <span>Posted: {formatDate(review.createdAt)}</span>
            {review.updatedAt && (
              <span>Updated: {formatDate(review.updatedAt)}</span>
            )}
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-borderLine bg-secondaryBg flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            {onOpenEditModal && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenEditModal(review);
                }}
              >
                <Edit2 size={14} />
                <span>Edit</span>
              </Button>
            )}

            {onOpenDeleteModal && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenDeleteModal(review);
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

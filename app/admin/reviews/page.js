"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Star,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  Hotel,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  User,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ReviewDetailModal from "@/components/admin/reviews/ReviewDetailModal";
import ReviewEditModal from "@/components/admin/reviews/ReviewEditModal";

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (err) {
    return "N/A";
  }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    star5Count: 0,
    star4Count: 0,
    star3Count: 0,
    star2Count: 0,
    star1Count: 0,
    destinationCount: 0,
    hotelCount: 0,
    guideCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [targetType, setTargetType] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals state
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Fetch Destinations for Filter Dropdown
  useEffect(() => {
    async function fetchDestinations() {
      try {
        const res = await fetch("/api/destinations?limit=100");
        const data = await res.json();
        if (res.ok && data.destinations) {
          setDestinations(data.destinations);
        }
      } catch (err) {
        console.error("Failed to load destinations for filter:", err);
      }
    }
    fetchDestinations();
  }, []);

  // Fetch Reviews API
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (targetType) params.append("targetType", targetType);
      if (ratingFilter) params.append("rating", ratingFilter);
      if (destinationFilter) params.append("destination", destinationFilter);
      params.append("page", page.toString());
      params.append("limit", "10");

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load reviews.");
      }

      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.total || 0);

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err.message || "An error occurred while fetching reviews.");
    } finally {
      setLoading(false);
    }
  }, [search, targetType, ratingFilter, destinationFilter, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setTargetType("");
    setRatingFilter("");
    setDestinationFilter("");
    setPage(1);
  };

  // Delete Review Action
  const handleDeleteConfirm = async () => {
    if (!selectedReview) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/admin/reviews/${selectedReview._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete review.");
      }

      setDeleteModalOpen(false);
      setSelectedReview(null);
      fetchReviews();
    } catch (err) {
      setDeleteError(err.message || "An error occurred while deleting review.");
    } finally {
      setDeleting(false);
    }
  };

  const renderStars = (rating = 5) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={13}
            className={s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
          />
        ))}
      </div>
    );
  };

  const getTargetInfo = (r) => {
    if (r.destination?.name) {
      return {
        name: r.destination.name,
        type: "DESTINATION",
        variant: "teal",
      };
    }
    if (r.hotel?.name) {
      return {
        name: r.hotel.name,
        type: "HOTEL",
        variant: "purple",
      };
    }
    if (r.guide?.name) {
      return {
        name: r.guide.name,
        type: "GUIDE",
        variant: "coral",
      };
    }
    return {
      name: "Target unavailable",
      type: "UNLINKED",
      variant: "amber",
    };
  };

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-borderLine">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-display font-extrabold text-primaryText tracking-tight">
              Reviews
            </h1>
            <Badge variant="coral" className="text-xs">
              Phase 8G
            </Badge>
          </div>
          <p className="text-xs text-mutedText mt-1">
            Manage user reviews and maintain accurate destination, hotel, and guide ratings.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchReviews}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* SUMMARY STATISTICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Reviews */}
        <div className="p-4 rounded-2xl bg-white border border-borderLine shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">
            Total Reviews
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-primaryText">
              {stats.total.toLocaleString()}
            </span>
            <Star size={18} className="text-coral-500 fill-coral-500" />
          </div>
        </div>

        {/* 5 Stars */}
        <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/80 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
            5 Stars
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-teal-900">
              {stats.star5Count.toLocaleString()}
            </span>
            <Badge variant="teal" className="text-[10px]">5 ★</Badge>
          </div>
        </div>

        {/* 4 Stars */}
        <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200/80 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
            4 Stars
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-sky-900">
              {stats.star4Count.toLocaleString()}
            </span>
            <Badge variant="sky" className="text-[10px]">4 ★</Badge>
          </div>
        </div>

        {/* 3 Stars */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            3 Stars
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-amber-900">
              {stats.star3Count.toLocaleString()}
            </span>
            <Badge variant="amber" className="text-[10px]">3 ★</Badge>
          </div>
        </div>

        {/* 2 Stars */}
        <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/80 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">
            2 Stars
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-orange-900">
              {stats.star2Count.toLocaleString()}
            </span>
            <Badge variant="amber" className="text-[10px]">2 ★</Badge>
          </div>
        </div>

        {/* 1 Star */}
        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            1 Star
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-rose-900">
              {stats.star1Count.toLocaleString()}
            </span>
            <Badge variant="rose" className="text-[10px]">1 ★</Badge>
          </div>
        </div>

      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="p-4 rounded-2xl bg-white border border-borderLine shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mutedText" />
            <input
              type="text"
              placeholder="Search comment, reviewer, target..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-borderLine bg-secondaryBg text-xs text-primaryText focus:outline-none focus:border-coral-500"
            />
          </div>

          {/* Target Type Filter */}
          <select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 rounded-xl border border-borderLine bg-secondaryBg text-xs text-primaryText focus:outline-none focus:border-coral-500"
          >
            <option value="">All Target Types</option>
            <option value="DESTINATION">Destinations</option>
            <option value="HOTEL">Hotels</option>
            <option value="GUIDE">Local Guides</option>
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 rounded-xl border border-borderLine bg-secondaryBg text-xs text-primaryText focus:outline-none focus:border-coral-500"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Destination Filter */}
          <select
            value={destinationFilter}
            onChange={(e) => {
              setDestinationFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 rounded-xl border border-borderLine bg-secondaryBg text-xs text-primaryText focus:outline-none focus:border-coral-500"
          >
            <option value="">All Destinations</option>
            {destinations.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}, {d.country}
              </option>
            ))}
          </select>

        </div>

        {/* Active Filters Reset */}
        {(search || targetType || ratingFilter || destinationFilter) && (
          <div className="pt-2 border-t border-borderLine flex items-center justify-between text-xs">
            <span className="text-mutedText">
              Active review filters applied. Showing matching results.
            </span>
            <button
              onClick={handleResetFilters}
              className="text-coral-600 hover:text-coral-700 font-semibold flex items-center gap-1"
            >
              <X size={14} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchReviews}>
            Retry
          </Button>
        </div>
      )}

      {/* REVIEWS TABLE / CARDS */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-borderLine">
          <RefreshCw size={24} className="animate-spin text-coral-500 mx-auto mb-3" />
          <p className="text-xs text-mutedText">Loading review records...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-borderLine space-y-3">
          <Star size={36} className="text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-primaryText">No Reviews Found</h3>
          <p className="text-xs text-mutedText max-w-sm mx-auto">
            {search || targetType || ratingFilter || destinationFilter
              ? "No reviews match the selected search criteria or filters."
              : "No reviews have been published on the platform yet."}
          </p>
          {(search || targetType || ratingFilter || destinationFilter) && (
            <Button variant="secondary" size="sm" onClick={handleResetFilters} className="mx-auto mt-2">
              Clear Search & Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden lg:block bg-white rounded-2xl border border-borderLine shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondaryBg border-b border-borderLine text-mutedText font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3.5">Reviewer</th>
                    <th className="px-4 py-3.5 text-center">Rating</th>
                    <th className="px-4 py-3.5">Review Comment</th>
                    <th className="px-4 py-3.5">Target</th>
                    <th className="px-4 py-3.5">Target Type</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderLine">
                  {reviews.map((r) => {
                    const target = getTargetInfo(r);
                    return (
                      <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Reviewer */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            {r.user?.profileImage ? (
                              <img
                                src={r.user.profileImage}
                                alt={r.user.name || "User"}
                                className="w-8 h-8 rounded-full object-cover border border-borderLine shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-coral-500/10 text-coral-500 font-bold flex items-center justify-center shrink-0 text-xs">
                                <User size={14} />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-primaryText block">
                                {r.user?.name || "Anonymous"}
                              </span>
                              <span className="text-[11px] text-mutedText block">
                                {r.user?.email || "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Rating */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex flex-col items-center">
                            {renderStars(r.rating)}
                            <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                              {r.rating}.0 / 5
                            </span>
                          </div>
                        </td>

                        {/* Comment */}
                        <td className="px-4 py-3.5 max-w-xs">
                          <p className="text-primaryText font-medium line-clamp-2 leading-relaxed">
                            "{r.comment}"
                          </p>
                        </td>

                        {/* Target Name */}
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-primaryText block">
                            {target.name}
                          </span>
                        </td>

                        {/* Target Type */}
                        <td className="px-4 py-3.5">
                          <Badge variant={target.variant} className="text-[10px]">
                            {target.type}
                          </Badge>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-mutedText font-medium whitespace-nowrap">
                          {formatDate(r.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedReview(r);
                                setDetailModalOpen(true);
                              }}
                              className="h-8 px-2 text-[11px]"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReview(r);
                                setEditModalOpen(true);
                              }}
                              className="h-8 px-2 text-[11px]"
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </Button>

                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setSelectedReview(r);
                                setDeleteModalOpen(true);
                              }}
                              className="h-8 px-2 text-[11px]"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reviews.map((r) => {
              const target = getTargetInfo(r);
              return (
                <div
                  key={r._id}
                  className="p-4 rounded-2xl bg-white border border-borderLine shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={target.variant} className="text-[10px]">
                      {target.type}
                    </Badge>
                    {renderStars(r.rating)}
                  </div>

                  <div>
                    <span className="font-bold text-sm text-primaryText block">
                      Target: {target.name}
                    </span>
                    <span className="text-xs text-mutedText block">
                      Reviewer: {r.user?.name || "Anonymous"} ({r.user?.email || ""})
                    </span>
                  </div>

                  <p className="p-3 rounded-xl bg-secondaryBg text-xs text-primaryText leading-relaxed italic">
                    "{r.comment}"
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-borderLine text-xs">
                    <span className="text-mutedText">{formatDate(r.createdAt)}</span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedReview(r);
                          setDetailModalOpen(true);
                        }}
                      >
                        <Eye size={13} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReview(r);
                          setEditModalOpen(true);
                        }}
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedReview(r);
                          setDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="p-4 bg-white rounded-2xl border border-borderLine flex items-center justify-between gap-3 text-xs">
              <span className="text-mutedText">
                Showing Page <strong className="text-primaryText">{page}</strong> of{" "}
                <strong className="text-primaryText">{totalPages}</strong> ({totalRecords} total reviews)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL */}
      <ReviewDetailModal
        review={selectedReview}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onOpenEditModal={(r) => {
          setSelectedReview(r);
          setEditModalOpen(true);
        }}
        onOpenDeleteModal={(r) => {
          setSelectedReview(r);
          setDeleteModalOpen(true);
        }}
      />

      {/* EDIT MODAL */}
      <ReviewEditModal
        review={selectedReview}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          fetchReviews();
        }}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-borderLine shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <h3 className="font-display font-bold text-base text-primaryText">
                Confirm Review Deletion
              </h3>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {deleteError}
              </div>
            )}

            <p className="text-xs text-bodyText leading-relaxed">
              Are you sure you want to delete this{" "}
              <strong className="font-bold text-primaryText">{selectedReview.rating}-star review</strong>{" "}
              by <strong className="font-bold text-primaryText">{selectedReview.user?.name || "User"}</strong> for{" "}
              <strong className="font-bold text-coral-600">
                {getTargetInfo(selectedReview).name}
              </strong>?
            </p>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
              The target's average rating and review count will be recalculated automatically from remaining reviews.
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteError("");
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                loading={deleting}
                disabled={deleting}
              >
                Delete Review
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

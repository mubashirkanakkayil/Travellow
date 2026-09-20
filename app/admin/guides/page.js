"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Star,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Award,
  X,
  MapPin,
  Clock,
  Languages,
} from "lucide-react";

import StarRating from "@/components/reviews/StarRating";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import GuideFormModal from "@/components/admin/guides/GuideFormModal";

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("ALL");
  const [verifiedFilter, setVerifiedFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);

  // Delete modal state
  const [deletingGuide, setDeletingGuide] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Success alert toast state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch available destinations for the filter dropdown
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const res = await fetch("/api/admin/destinations?limit=100");
        const data = await res.json();
        if (res.ok && data.success) {
          setDestinations(data.destinations || []);
        }
      } catch (err) {
        console.error("Error fetching destinations for guide filter:", err);
      }
    };

    fetchDestinations();
  }, []);

  // Fetch guides from API
  const fetchGuides = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (selectedDestination !== "ALL") params.append("destination", selectedDestination);
      if (verifiedFilter !== "ALL") params.append("verified", verifiedFilter);
      if (sortBy) params.append("sort", sortBy);

      const res = await fetch(`/api/admin/guides?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setGuides(data.guides || []);
      } else {
        setError(data.error || "Failed to load guides.");
      }
    } catch (err) {
      console.error("Error fetching admin guides:", err);
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGuides();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedDestination, verifiedFilter, sortBy]);

  const handleOpenAdd = () => {
    setEditingGuide(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (guideDoc) => {
    setEditingGuide(guideDoc);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (guideDoc) => {
    showToast(
      editingGuide
        ? `Guide "${guideDoc.name}" updated successfully!`
        : `Guide "${guideDoc.name}" created successfully!`
    );
    fetchGuides();
  };

  // Confirm and delete guide safely
  const handleConfirmDelete = async () => {
    if (!deletingGuide) return;
    setDeleteError(null);

    try {
      setDeleteSubmitting(true);
      const res = await fetch(`/api/admin/guides/${deletingGuide._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Guide "${deletingGuide.name}" deleted successfully.`);
        setDeletingGuide(null);
        fetchGuides();
      } else if (res.status === 409) {
        // Dependency protection blocked deletion
        setDeleteError(data.error || "Cannot delete guide because related bookings or reviews exist.");
      } else {
        setDeleteError(data.error || "Failed to delete guide.");
      }
    } catch (err) {
      console.error("Delete guide error:", err);
      setDeleteError("Network error while attempting to delete guide.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDestination("ALL");
    setVerifiedFilter("ALL");
    setSortBy("newest");
  };

  return (
    <div className="space-y-6">
      
      {/* TOAST SUCCESS ALERT */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-borderLine shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-coral-500 uppercase tracking-widest">
            <Users size={16} />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-primaryText tracking-tight">
            Local Guides Management
          </h1>
          <p className="text-xs sm:text-sm text-bodyText">
            Manage Travellow-listed local guides and guide information in MongoDB.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenAdd} className="gap-2 shrink-0">
          <Plus size={18} />
          <span>Add Guide</span>
        </Button>
      </div>

      {/* TOOLBAR: SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-borderLine shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-wrap">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-3 text-mutedText" />
            <input
              type="text"
              placeholder="Search name, country, specialties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
            />
          </div>

          {/* Destination Dropdown Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-mutedText font-semibold flex items-center gap-1 shrink-0">
              <MapPin size={14} /> Destination:
            </span>
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="px-3 py-2 rounded-xl bg-secondaryBg border border-borderLine text-xs font-semibold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50 w-full sm:w-auto"
            >
              <option value="ALL">All Destinations</option>
              {destinations.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.country})
                </option>
              ))}
            </select>
          </div>

          {/* Verified Status Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-mutedText font-semibold flex items-center gap-1 shrink-0">
              <Award size={14} className="text-teal-600" /> Status:
            </span>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-secondaryBg border border-borderLine text-xs font-semibold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50 w-full sm:w-auto"
            >
              <option value="ALL">All</option>
              <option value="true">Verified Only</option>
              <option value="false">Unverified Only</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-mutedText font-semibold shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-secondaryBg border border-borderLine text-xs font-semibold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50 w-full sm:w-auto"
            >
              <option value="newest">Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="rating">Highest Rated</option>
              <option value="rate_asc">Hourly Rate (Low ➔ High)</option>
              <option value="rate_desc">Hourly Rate (High ➔ Low)</option>
              <option value="experience">Experience Years</option>
            </select>
          </div>

        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <span className="text-xs text-mutedText font-medium">
            Total: <strong>{guides.length}</strong> guides
          </span>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear Filters
          </Button>
          <Button variant="outline" size="sm" onClick={fetchGuides} title="Refresh">
            <RefreshCw size={14} className={loading ? "animate-spin text-coral-500" : ""} />
          </Button>
        </div>

      </div>

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="p-8 rounded-3xl bg-white border border-rose-200 text-center space-y-3 shadow-sm">
          <AlertCircle size={32} className="text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-primaryText">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchGuides}>
            Try Again
          </Button>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && (
        <div className="bg-white p-6 rounded-3xl border border-borderLine shadow-sm space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && guides.length === 0 && (
        <div className="p-12 bg-white rounded-3xl border border-borderLine text-center space-y-4 shadow-sm">
          <Users size={40} className="mx-auto text-indigo-500" />
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-primaryText">No Guides Found</h3>
            <p className="text-xs text-mutedText max-w-sm mx-auto">
              No local guide records matched your search criteria or filters. Try clearing your filters or create a new guide.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            <Plus size={16} /> Add First Guide
          </Button>
        </div>
      )}

      {/* RESPONSIVE TABLE & LIST VIEW */}
      {!loading && !error && guides.length > 0 && (
        <div className="bg-white rounded-3xl border border-borderLine shadow-sm overflow-hidden">
          
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondaryBg/80 text-mutedText text-[11px] font-bold uppercase tracking-wider border-b border-borderLine">
                  <th className="py-4 px-6">Guide Name</th>
                  <th className="py-4 px-4">Destination</th>
                  <th className="py-4 px-4">Experience</th>
                  <th className="py-4 px-4">Hourly Rate</th>
                  <th className="py-4 px-4">Rating</th>
                  <th className="py-4 px-4">Verification</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLine text-xs font-medium text-primaryText">
                {guides.map((guideDoc) => {
                  const destName = guideDoc.destination?.name || "Unassigned";
                  const destCountry = guideDoc.destination?.country || guideDoc.country;

                  return (
                    <tr key={guideDoc._id} className="hover:bg-secondaryBg/40 transition-colors">
                      
                      {/* Profile Image & Guide Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-borderLine">
                            <Image
                              src={guideDoc.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
                              alt={guideDoc.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-primaryText flex items-center gap-1.5">
                              <span>{guideDoc.name}</span>
                              {guideDoc.verified && (
                                <Award size={13} className="text-teal-600" title="Verified Guide" />
                              )}
                            </div>
                            <span className="text-[11px] text-mutedText block line-clamp-1 max-w-xs">
                              {guideDoc.specialties?.slice(0, 2).join(", ") || guideDoc.country}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-primaryText block flex items-center gap-1">
                            <MapPin size={13} className="text-coral-500 shrink-0" />
                            <span>{destName}</span>
                          </span>
                          <span className="text-[11px] text-mutedText block">
                            {guideDoc.country}
                          </span>
                        </div>
                      </td>

                      {/* Experience */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-xs text-primaryText block">
                          {guideDoc.experienceYears || 0} Years
                        </span>
                        <span className="text-[10px] text-mutedText block">
                          Local Expert
                        </span>
                      </td>

                      {/* Hourly Rate */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-sm text-primaryText">
                          ₹{guideDoc.hourlyRate?.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-mutedText block">/ hour</span>
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-bold text-primaryText">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            <span>{guideDoc.rating || 0}</span>
                          </div>
                          <span className="text-[10px] text-mutedText block">
                            {guideDoc.reviewCount || 0} reviews
                          </span>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-4 px-4">
                        {guideDoc.verified ? (
                          <Badge variant="teal" className="text-[10px] gap-1">
                            <CheckCircle2 size={11} /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="ghost" className="text-[10px] text-mutedText bg-slate-100">
                            Unverified
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(guideDoc)}
                            className="h-8 px-2.5 text-xs gap-1"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingGuide(guideDoc);
                            }}
                            className="h-8 px-2.5 text-xs text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </Button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD LIST */}
          <div className="md:hidden divide-y divide-borderLine">
            {guides.map((guideDoc) => {
              const destName = guideDoc.destination?.name || "Unassigned";

              return (
                <div key={guideDoc._id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-borderLine">
                      <Image src={guideDoc.profileImage} alt={guideDoc.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-primaryText truncate flex items-center gap-1">
                          <span>{guideDoc.name}</span>
                          {guideDoc.verified && <Award size={12} className="text-teal-600" />}
                        </h4>
                        <span className="text-[11px] font-bold text-indigo-600">{guideDoc.experienceYears}y exp</span>
                      </div>
                      <span className="text-xs text-mutedText block truncate">{destName} • {guideDoc.country}</span>
                      <span className="font-bold text-xs text-coral-600 block mt-1">
                        ₹{guideDoc.hourlyRate?.toLocaleString("en-IN")} / hour
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-borderLine/50 text-xs">
                    <div className="flex items-center gap-1 font-semibold text-primaryText">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>{guideDoc.rating || 0}</span>
                      <span className="text-mutedText">({guideDoc.reviewCount || 0})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(guideDoc)} className="h-7 text-[11px] px-2">
                        <Edit2 size={12} /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setDeleteError(null); setDeletingGuide(guideDoc); }} className="h-7 text-[11px] px-2 text-rose-600">
                        <Trash2 size={12} /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ADD / EDIT FORM MODAL */}
      <GuideFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        guideToEdit={editingGuide}
        onSuccess={handleFormSuccess}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {deletingGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-borderLine shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-display font-bold text-lg text-primaryText">
                Delete Local Guide Record
              </h3>
              <p className="text-xs text-bodyText leading-relaxed">
                Are you sure you want to delete guide <strong className="text-primaryText">{deletingGuide.name}</strong> ({deletingGuide.country})?
              </p>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-[11px] border border-amber-200 text-left space-y-1">
                <span className="font-bold block">Dependency Safety Safeguard:</span>
                <span>Deletion will be blocked if related guide booking history or guest reviews exist in MongoDB Atlas.</span>
              </div>
            </div>

            {deleteError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingGuide(null)}
                disabled={deleteSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={deleteSubmitting}
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {deleteSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Guide</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

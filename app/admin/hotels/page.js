"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Hotel,
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
  Sparkles,
  X,
  MapPin,
  Building2,
  DollarSign,
} from "lucide-react";

import StarRating from "@/components/reviews/StarRating";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import HotelFormModal from "@/components/admin/hotels/HotelFormModal";

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("ALL");
  const [featuredFilter, setFeaturedFilter] = useState("ALL");
  const [aiFilter, setAiFilter] = useState("ALL");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);

  // Delete modal state
  const [deletingHotel, setDeletingHotel] = useState(null);
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
        console.error("Error fetching destinations for filter:", err);
      }
    };

    fetchDestinations();
  }, []);

  // Fetch hotels from API
  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (selectedDestination !== "ALL") params.append("destination", selectedDestination);
      if (featuredFilter !== "ALL") params.append("featured", featuredFilter);
      if (aiFilter !== "ALL") params.append("aiEligible", aiFilter);

      const res = await fetch(`/api/admin/hotels?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setHotels(data.hotels || []);
      } else {
        setError(data.error || "Failed to load hotels.");
      }
    } catch (err) {
      console.error("Error fetching admin hotels:", err);
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHotels();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedDestination, featuredFilter, aiFilter]);

  const handleOpenAdd = () => {
    setEditingHotel(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (hotelDoc) => {
    setEditingHotel(hotelDoc);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (hotelDoc) => {
    showToast(
      editingHotel
        ? `Hotel "${hotelDoc.name}" updated successfully!`
        : `Hotel "${hotelDoc.name}" created successfully!`
    );
    fetchHotels();
  };

  // Confirm and delete hotel safely
  const handleConfirmDelete = async () => {
    if (!deletingHotel) return;
    setDeleteError(null);

    try {
      setDeleteSubmitting(true);
      const res = await fetch(`/api/admin/hotels/${deletingHotel._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Hotel "${deletingHotel.name}" deleted successfully.`);
        setDeletingHotel(null);
        fetchHotels();
      } else if (res.status === 409) {
        // Dependency protection blocked deletion
        setDeleteError(data.error || "Cannot delete hotel because related bookings or reviews exist.");
      } else {
        setDeleteError(data.error || "Failed to delete hotel.");
      }
    } catch (err) {
      console.error("Delete hotel error:", err);
      setDeleteError("Network error while attempting to delete hotel.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDestination("ALL");
    setFeaturedFilter("ALL");
    setAiFilter("ALL");
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
            <Hotel size={16} />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-primaryText tracking-tight">
            Hotels & Accommodations Management
          </h1>
          <p className="text-xs sm:text-sm text-bodyText">
            Manage Travellow-listed hotels and accommodation information in MongoDB.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenAdd} className="gap-2 shrink-0">
          <Plus size={18} />
          <span>Add Hotel</span>
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
              placeholder="Search name, country, address..."
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

          {/* Featured Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-mutedText font-semibold shrink-0">Featured:</span>
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-secondaryBg border border-borderLine text-xs font-semibold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50 w-full sm:w-auto"
            >
              <option value="ALL">All</option>
              <option value="true">Featured Only</option>
              <option value="false">Standard Only</option>
            </select>
          </div>

          {/* AI Eligible Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-mutedText font-semibold flex items-center gap-1 shrink-0">
              <Sparkles size={13} className="text-coral-500" /> AI Eligible:
            </span>
            <select
              value={aiFilter}
              onChange={(e) => setAiFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-secondaryBg border border-borderLine text-xs font-semibold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50 w-full sm:w-auto"
            >
              <option value="ALL">All</option>
              <option value="true">AI Eligible</option>
              <option value="false">Not AI Eligible</option>
            </select>
          </div>

        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <span className="text-xs text-mutedText font-medium">
            Total: <strong>{hotels.length}</strong> items
          </span>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear Filters
          </Button>
          <Button variant="outline" size="sm" onClick={fetchHotels} title="Refresh">
            <RefreshCw size={14} className={loading ? "animate-spin text-coral-500" : ""} />
          </Button>
        </div>

      </div>

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="p-8 rounded-3xl bg-white border border-rose-200 text-center space-y-3 shadow-sm">
          <AlertCircle size={32} className="text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-primaryText">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchHotels}>
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
      {!loading && !error && hotels.length === 0 && (
        <div className="p-12 bg-white rounded-3xl border border-borderLine text-center space-y-4 shadow-sm">
          <Hotel size={40} className="mx-auto text-amber-500" />
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-primaryText">No Hotels Found</h3>
            <p className="text-xs text-mutedText max-w-sm mx-auto">
              No hotel listings matched your search criteria or filters. Try clearing your filters or create a new hotel.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            <Plus size={16} /> Add First Hotel
          </Button>
        </div>
      )}

      {/* RESPONSIVE TABLE & LIST VIEW */}
      {!loading && !error && hotels.length > 0 && (
        <div className="bg-white rounded-3xl border border-borderLine shadow-sm overflow-hidden">
          
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondaryBg/80 text-mutedText text-[11px] font-bold uppercase tracking-wider border-b border-borderLine">
                  <th className="py-4 px-6">Hotel Name</th>
                  <th className="py-4 px-4">Destination & Country</th>
                  <th className="py-4 px-4">Price / Night</th>
                  <th className="py-4 px-4">Rating</th>
                  <th className="py-4 px-4">Flags</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLine text-xs font-medium text-primaryText">
                {hotels.map((hotelDoc) => {
                  const destName = hotelDoc.destination?.name || "Unassigned";
                  const destCountry = hotelDoc.destination?.country || hotelDoc.country;

                  return (
                    <tr key={hotelDoc._id} className="hover:bg-secondaryBg/40 transition-colors">
                      
                      {/* Hotel Name & Image */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-borderLine">
                            <Image
                              src={hotelDoc.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80"}
                              alt={hotelDoc.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-primaryText">
                              {hotelDoc.name}
                            </div>
                            <span className="text-[11px] text-mutedText block">
                              {hotelDoc.address || destCountry}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Destination & Country */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="font-bold text-primaryText block flex items-center gap-1">
                            <MapPin size={13} className="text-coral-500 shrink-0" />
                            <span>{destName}</span>
                          </span>
                          <span className="text-[11px] text-mutedText block">
                            {hotelDoc.country}
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-sm text-primaryText">
                          ₹{hotelDoc.pricePerNight?.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-mutedText block">/ night</span>
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-bold text-primaryText">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            <span>{hotelDoc.rating || 0}</span>
                          </div>
                          <span className="text-[10px] text-mutedText block">
                            {hotelDoc.reviewCount || 0} reviews
                          </span>
                        </div>
                      </td>

                      {/* Flags (Featured & AI Eligible) */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {hotelDoc.featured && (
                            <Badge variant="success" className="text-[10px]">
                              Featured
                            </Badge>
                          )}
                          {hotelDoc.aiEligible ? (
                            <Badge variant="coral" className="text-[10px] gap-1 py-0">
                              <Sparkles size={10} /> AI Eligible
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-mutedText">Non-AI</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(hotelDoc)}
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
                              setDeletingHotel(hotelDoc);
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
            {hotels.map((hotelDoc) => {
              const destName = hotelDoc.destination?.name || "Unassigned";

              return (
                <div key={hotelDoc._id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-borderLine">
                      <Image src={hotelDoc.image} alt={hotelDoc.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-primaryText truncate">{hotelDoc.name}</h4>
                        {hotelDoc.featured && <Badge variant="success" className="text-[9px]">Featured</Badge>}
                      </div>
                      <span className="text-xs text-mutedText block truncate">{destName} • {hotelDoc.country}</span>
                      <span className="font-bold text-xs text-coral-600 block mt-1">
                        ₹{hotelDoc.pricePerNight?.toLocaleString("en-IN")} / night
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-borderLine/50 text-xs">
                    <div className="flex items-center gap-1 font-semibold text-primaryText">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>{hotelDoc.rating || 0}</span>
                      <span className="text-mutedText">({hotelDoc.reviewCount || 0})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(hotelDoc)} className="h-7 text-[11px] px-2">
                        <Edit2 size={12} /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setDeleteError(null); setDeletingHotel(hotelDoc); }} className="h-7 text-[11px] px-2 text-rose-600">
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
      <HotelFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        hotelToEdit={editingHotel}
        onSuccess={handleFormSuccess}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {deletingHotel && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-borderLine shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-display font-bold text-lg text-primaryText">
                Delete Hotel Listing
              </h3>
              <p className="text-xs text-bodyText leading-relaxed">
                Are you sure you want to delete <strong className="text-primaryText">{deletingHotel.name}</strong> ({deletingHotel.country})?
              </p>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-[11px] border border-amber-200 text-left space-y-1">
                <span className="font-bold block">Dependency Safety Guard:</span>
                <span>Deletion will be blocked if related booking history or guest reviews exist in MongoDB Atlas.</span>
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
                onClick={() => setDeletingHotel(null)}
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
                  <span>Delete Hotel</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

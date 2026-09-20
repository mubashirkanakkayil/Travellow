"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
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
  Compass,
} from "lucide-react";

import StarRating from "@/components/reviews/StarRating";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DestinationFormModal from "@/components/admin/destinations/DestinationFormModal";

const regions = [
  { label: "All Regions", value: "ALL" },
  { label: "India", value: "INDIA" },
  { label: "Asia", value: "ASIA" },
  { label: "Europe", value: "EUROPE" },
];

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [countryFilter, setCountryFilter] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState(null);

  // Delete modal state
  const [deletingDestination, setDeletingDestination] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Success alert toast state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch destinations
  const fetchDestinations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedRegion !== "ALL") params.append("region", selectedRegion);
      if (countryFilter.trim()) params.append("country", countryFilter.trim());
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/admin/destinations?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setDestinations(data.destinations || []);
      } else {
        setError(data.error || "Failed to load destinations.");
      }
    } catch (err) {
      console.error("Error fetching admin destinations:", err);
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDestinations();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedRegion, countryFilter]);

  const handleOpenAdd = () => {
    setEditingDestination(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (dest) => {
    setEditingDestination(dest);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (dest) => {
    showToast(
      editingDestination
        ? `Destination "${dest.name}" updated successfully!`
        : `Destination "${dest.name}" created successfully!`
    );
    fetchDestinations();
  };

  // Confirm and delete destination safely
  const handleConfirmDelete = async () => {
    if (!deletingDestination) return;
    setDeleteError(null);

    try {
      setDeleteSubmitting(true);
      const res = await fetch(`/api/admin/destinations/${deletingDestination._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Destination "${deletingDestination.name}" deleted successfully.`);
        setDeletingDestination(null);
        fetchDestinations();
      } else if (res.status === 409) {
        // Dependency protection blocked deletion
        setDeleteError(data.error || "Cannot delete destination because related records exist.");
      } else {
        setDeleteError(data.error || "Failed to delete destination.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setDeleteError("Network error while trying to delete destination.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRegion("ALL");
    setCountryFilter("");
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
            <MapPin size={16} />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-primaryText tracking-tight">
            Destinations Catalog Management
          </h1>
          <p className="text-xs sm:text-sm text-bodyText">
            Create, edit, and safely manage travel destinations across India, Asia, and Europe in MongoDB.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenAdd} className="gap-2 shrink-0">
          <Plus size={18} />
          <span>Add Destination</span>
        </Button>
      </div>

      {/* TOOLBAR: SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-borderLine shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-3 text-mutedText" />
            <input
              type="text"
              placeholder="Search name, country, slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
            />
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-mutedText font-semibold flex items-center gap-1 shrink-0">
              <Filter size={14} /> Region:
            </span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 rounded-xl bg-secondaryBg border border-borderLine text-xs font-semibold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50 w-full sm:w-auto"
            >
              {regions.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <span className="text-xs text-mutedText font-medium">
            Total: <strong>{destinations.length}</strong> items
          </span>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear Filters
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDestinations} title="Refresh">
            <RefreshCw size={14} className={loading ? "animate-spin text-coral-500" : ""} />
          </Button>
        </div>
      </div>

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="p-8 rounded-3xl bg-white border border-rose-200 text-center space-y-3 shadow-sm">
          <AlertCircle size={32} className="text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-primaryText">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchDestinations}>
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
      {!loading && !error && destinations.length === 0 && (
        <div className="p-12 bg-white rounded-3xl border border-borderLine text-center space-y-4 shadow-sm">
          <MapPin size={40} className="mx-auto text-coral-500" />
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-primaryText">No Destinations Found</h3>
            <p className="text-xs text-mutedText max-w-sm mx-auto">
              No destination records matched your search or filters. Try clearing your filters or create a new destination.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            <Plus size={16} /> Add First Destination
          </Button>
        </div>
      )}

      {/* RESPONSIVE TABLE & LIST VIEW */}
      {!loading && !error && destinations.length > 0 && (
        <div className="bg-white rounded-3xl border border-borderLine shadow-sm overflow-hidden">
          
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondaryBg/80 text-mutedText text-[11px] font-bold uppercase tracking-wider border-b border-borderLine">
                  <th className="py-4 px-6">Destination</th>
                  <th className="py-4 px-4">Region & Country</th>
                  <th className="py-4 px-4">Starting Price</th>
                  <th className="py-4 px-4">Rating</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLine text-xs font-medium text-primaryText">
                {destinations.map((dest) => (
                  <tr key={dest._id} className="hover:bg-secondaryBg/40 transition-colors">
                    
                    {/* Destination Name & Image */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-borderLine">
                          <Image
                            src={dest.image || "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=400&q=80"}
                            alt={dest.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-primaryText flex items-center gap-1.5">
                            <span>{dest.name}</span>
                            <Link
                              href={`/destinations/${dest.slug || dest._id}`}
                              target="_blank"
                              className="text-slate-400 hover:text-coral-500"
                              title="View Public Page"
                            >
                              <ExternalLink size={13} />
                            </Link>
                          </div>
                          <span className="text-[11px] text-mutedText font-mono block">
                            /{dest.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Region & Country */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span className="font-semibold block text-primaryText">{dest.country}</span>
                        <Badge variant="coral" className="text-[10px] py-0 px-2">
                          {dest.region}
                        </Badge>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-4">
                      <span className="font-bold text-sm text-primaryText">
                        ₹{dest.startingPrice?.toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 font-bold text-primaryText">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          <span>{dest.rating || 4.8}</span>
                        </div>
                        <span className="text-[10px] text-mutedText block">
                          {dest.reviewCount || 0} reviews
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {dest.featured ? (
                        <Badge variant="success" className="text-[10px]">
                          Featured
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-mutedText">Standard</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(dest)}
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
                            setDeletingDestination(dest);
                          }}
                          className="h-8 px-2.5 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD LIST */}
          <div className="md:hidden divide-y divide-borderLine">
            {destinations.map((dest) => (
              <div key={dest._id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-borderLine">
                    <Image src={dest.image} alt={dest.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-primaryText truncate">{dest.name}</h4>
                      <Badge variant="coral" className="text-[10px]">{dest.region}</Badge>
                    </div>
                    <span className="text-xs text-mutedText block">{dest.country}</span>
                    <span className="font-bold text-xs text-coral-600 block mt-1">
                      ₹{dest.startingPrice?.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-borderLine/50 text-xs">
                  <div className="flex items-center gap-1 font-semibold text-primaryText">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span>{dest.rating}</span>
                    <span className="text-mutedText">({dest.reviewCount})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(dest)} className="h-7 text-[11px] px-2">
                      <Edit2 size={12} /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setDeleteError(null); setDeletingDestination(dest); }} className="h-7 text-[11px] px-2 text-rose-600">
                      <Trash2 size={12} /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ADD / EDIT FORM MODAL */}
      <DestinationFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        destinationToEdit={editingDestination}
        onSuccess={handleFormSuccess}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDestination && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-borderLine shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-display font-bold text-lg text-primaryText">
                Delete Destination
              </h3>
              <p className="text-xs text-bodyText leading-relaxed">
                Are you sure you want to delete <strong className="text-primaryText">{deletingDestination.name}</strong> ({deletingDestination.country})?
              </p>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-[11px] border border-amber-200 text-left space-y-1">
                <span className="font-bold block">Dependency Safety Protection:</span>
                <span>Deletion will be blocked if related hotels, guides, bookings, or reviews exist in MongoDB Atlas.</span>
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
                onClick={() => setDeletingDestination(null)}
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
                  <span>Delete Destination</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

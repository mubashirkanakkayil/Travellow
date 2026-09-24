"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Hotel,
  Users,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import BookingDetailModal from "@/components/admin/bookings/BookingDetailModal";
import BookingStatusModal from "@/components/admin/bookings/BookingStatusModal";

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

function formatCurrency(amount, currency = "INR") {
  if (amount === undefined || amount === null) return "₹0";
  try {
    return `${currency === "INR" ? "₹" : "$"}${Number(amount).toLocaleString("en-IN")} ${currency}`;
  } catch (err) {
    return `${amount} ${currency}`;
  }
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pendingCount: 0,
    confirmedCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    hotelCount: 0,
    guideCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [bookingType, setBookingType] = useState("");
  const [status, setStatus] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

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

  // Fetch Bookings API
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (bookingType) params.append("bookingType", bookingType);
      if (status) params.append("status", status);
      if (destinationFilter) params.append("destination", destinationFilter);
      params.append("page", page.toString());
      params.append("limit", "10");

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load bookings.");
      }

      setBookings(data.bookings || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.total || 0);

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err.message || "An error occurred while fetching bookings.");
    } finally {
      setLoading(false);
    }
  }, [search, bookingType, status, destinationFilter, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle Search Input Change with Debounce
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setBookingType("");
    setStatus("");
    setDestinationFilter("");
    setPage(1);
  };

  const getStatusBadge = (bStatus) => {
    switch (bStatus) {
      case "CONFIRMED":
        return <Badge variant="teal">CONFIRMED</Badge>;
      case "COMPLETED":
        return <Badge variant="purple">COMPLETED</Badge>;
      case "CANCELLED":
        return <Badge variant="rose">CANCELLED</Badge>;
      case "PENDING":
      default:
        return <Badge variant="amber">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-borderLine">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-display font-extrabold text-primaryText tracking-tight">
              Bookings
            </h1>
            <Badge variant="coral" className="text-xs">
              Phase 8F
            </Badge>
          </div>
          <p className="text-xs text-mutedText mt-1">
            Manage Travellow hotel and guide bookings across destinations.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchBookings}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* SUMMARY STATISTICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Bookings */}
        <div className="p-4 rounded-2xl bg-white border border-borderLine shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">
            Total Bookings
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-primaryText">
              {stats.total.toLocaleString()}
            </span>
            <CalendarCheck size={18} className="text-coral-500" />
          </div>
        </div>

        {/* Pending */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Pending
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-amber-900">
              {stats.pendingCount.toLocaleString()}
            </span>
            <Badge variant="amber" className="text-[10px]">PENDING</Badge>
          </div>
        </div>

        {/* Confirmed */}
        <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
            Confirmed
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-teal-900">
              {stats.confirmedCount.toLocaleString()}
            </span>
            <Badge variant="teal" className="text-[10px]">CONFIRMED</Badge>
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
            Completed
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-purple-900">
              {stats.completedCount.toLocaleString()}
            </span>
            <Badge variant="purple" className="text-[10px]">COMPLETED</Badge>
          </div>
        </div>

        {/* Cancelled */}
        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
            Cancelled
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold text-rose-900">
              {stats.cancelledCount.toLocaleString()}
            </span>
            <Badge variant="rose" className="text-[10px]">CANCELLED</Badge>
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
              placeholder="Search user, hotel, guide, destination..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-borderLine bg-secondaryBg text-xs text-primaryText focus:outline-none focus:border-coral-500"
            />
          </div>

          {/* Booking Type Filter */}
          <select
            value={bookingType}
            onChange={(e) => {
              setBookingType(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 rounded-xl border border-borderLine bg-secondaryBg text-xs text-primaryText focus:outline-none focus:border-coral-500"
          >
            <option value="">All Booking Types</option>
            <option value="HOTEL">Hotel Stays</option>
            <option value="GUIDE">Local Guide Tours</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 rounded-xl border border-borderLine bg-secondaryBg text-xs text-primaryText focus:outline-none focus:border-coral-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
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

        {/* Active Filters Bar */}
        {(search || bookingType || status || destinationFilter) && (
          <div className="pt-2 border-t border-borderLine flex items-center justify-between text-xs">
            <span className="text-mutedText">
              Active filters applied. Showing matching results.
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

      {/* ERROR MESSAGE DISPLAY */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchBookings}>
            Retry
          </Button>
        </div>
      )}

      {/* BOOKINGS CONTENT TABLE / CARDS */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-borderLine">
          <RefreshCw size={24} className="animate-spin text-coral-500 mx-auto mb-3" />
          <p className="text-xs text-mutedText">Loading booking records...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-borderLine space-y-3">
          <CalendarCheck size={36} className="text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-primaryText">No Bookings Found</h3>
          <p className="text-xs text-mutedText max-w-sm mx-auto">
            {search || bookingType || status || destinationFilter
              ? "No booking records match the selected search parameters or filters."
              : "No platform bookings have been recorded yet."}
          </p>
          {(search || bookingType || status || destinationFilter) && (
            <Button variant="secondary" size="sm" onClick={handleResetFilters} className="mx-auto mt-2">
              Clear Search & Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden lg:block bg-white rounded-2xl border border-borderLine shadow-sm overflow-hidden">
            <div className="w-full">
              <table className="w-full text-left text-xs table-auto">
                <thead className="bg-secondaryBg border-b border-borderLine text-mutedText font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-2 py-3">Type</th>
                    <th className="px-3 py-3">Hotel / Guide</th>
                    <th className="px-3 py-3">Destination</th>
                    <th className="px-3 py-3">Dates / Duration</th>
                    <th className="px-2 py-3 text-center">Guests</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                    <th className="px-2 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderLine">
                  {bookings.map((b) => {
                    const isHotel = b.bookingType === "HOTEL";
                    return (
                      <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Customer */}
                        <td className="px-3 py-3 max-w-[140px]">
                          <span className="font-bold text-primaryText block truncate" title={b.user?.name || "Guest User"}>
                            {b.user?.name || "Guest User"}
                          </span>
                          <span className="text-[11px] text-mutedText block truncate" title={b.user?.email || "N/A"}>
                            {b.user?.email || "N/A"}
                          </span>
                        </td>

                        {/* Type Badge */}
                        <td className="px-2 py-3">
                          <Badge variant={isHotel ? "teal" : "coral"} className="text-[9px] px-1.5 py-0.5">
                            {isHotel ? "HOTEL" : "GUIDE"}
                          </Badge>
                        </td>

                        {/* Hotel / Guide Target */}
                        <td className="px-3 py-3 max-w-[150px]">
                          <span className="font-semibold text-primaryText block truncate" title={isHotel ? b.hotel?.name || "Hotel Stay" : b.guide?.name || "Guide Tour"}>
                            {isHotel ? b.hotel?.name || "Hotel Stay" : b.guide?.name || "Guide Tour"}
                          </span>
                          <span className="text-[10px] text-mutedText block font-mono">
                            ID: {b._id.slice(-6)}
                          </span>
                        </td>

                        {/* Destination */}
                        <td className="px-3 py-3 max-w-[130px]">
                          <span className="font-medium text-primaryText block truncate" title={b.destination?.name || "Target City"}>
                            {b.destination?.name || "Target City"}
                          </span>
                          <span className="text-[11px] text-mutedText block truncate">
                            {b.destination?.country || "India"}
                          </span>
                        </td>

                        {/* Dates / Duration */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="font-medium text-primaryText block text-[11px]">
                            {formatDate(b.startDate)}
                          </span>
                          <span className="text-[10px] text-mutedText block">
                            {isHotel
                              ? b.endDate ? `to ${formatDate(b.endDate)}` : "1 Night"
                              : `${b.hours || 1} Hours`}
                          </span>
                        </td>

                        {/* Guests */}
                        <td className="px-2 py-3 text-center font-medium text-primaryText text-xs">
                          {b.guests || 1}
                        </td>

                        {/* Amount */}
                        <td className="px-3 py-3 text-right font-bold text-coral-600 text-xs whitespace-nowrap">
                          {formatCurrency(b.totalAmount, b.currency)}
                        </td>

                        {/* Status */}
                        <td className="px-2 py-3 text-center whitespace-nowrap">
                          {getStatusBadge(b.status)}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(b);
                                setDetailModalOpen(true);
                              }}
                              className="h-7 px-2 text-[10px]"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(b);
                                setStatusModalOpen(true);
                              }}
                              className="h-7 px-2 text-[10px]"
                            >
                              Status
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
            {bookings.map((b) => {
              const isHotel = b.bookingType === "HOTEL";
              return (
                <div
                  key={b._id}
                  className="p-4 rounded-2xl bg-white border border-borderLine shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={isHotel ? "teal" : "coral"} className="text-[10px]">
                      {isHotel ? "HOTEL" : "GUIDE"}
                    </Badge>
                    {getStatusBadge(b.status)}
                  </div>

                  <div>
                    <span className="font-bold text-sm text-primaryText block">
                      {isHotel ? b.hotel?.name || "Hotel Reservation" : b.guide?.name || "Local Guide Tour"}
                    </span>
                    <span className="text-xs text-mutedText block">
                      Customer: {b.user?.name || "Guest User"} ({b.user?.email})
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-secondaryBg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-mutedText">Destination:</span>
                      <span className="font-semibold text-primaryText">{b.destination?.name || "Target City"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mutedText">Date:</span>
                      <span className="font-semibold text-primaryText">{formatDate(b.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mutedText">Total Amount:</span>
                      <span className="font-bold text-coral-600">{formatCurrency(b.totalAmount, b.currency)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-borderLine">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(b);
                        setDetailModalOpen(true);
                      }}
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(b);
                        setStatusModalOpen(true);
                      }}
                    >
                      Status
                    </Button>
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
                <strong className="text-primaryText">{totalPages}</strong> ({totalRecords} total bookings)
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
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onOpenStatusModal={(b) => {
          setSelectedBooking(b);
          setStatusModalOpen(true);
        }}
      />

      {/* STATUS MODAL */}
      <BookingStatusModal
        booking={selectedBooking}
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onSuccess={(updatedBooking) => {
          fetchBookings();
        }}
      />

    </div>
  );
}

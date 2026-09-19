"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Hotel,
  UserCheck,
  MapPin,
  Clock,
  Users,
  AlertCircle,
  Loader2,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import CancelBookingModal from "@/components/bookings/CancelBookingModal";

export default function MyBookingsSection() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL | HOTEL | GUIDE
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/bookings");
      const data = await res.json();

      if (data.success) {
        setBookings(data.data || []);
      } else {
        setError("Unable to load your bookings.");
      }
    } catch (err) {
      setError("Unable to load your bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;

    try {
      setCancelLoading(true);
      const res = await fetch(`/api/bookings/${selectedBookingForCancel._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.success) {
        // Update local state immediately
        setBookings((prev) =>
          prev.map((b) =>
            b._id === selectedBookingForCancel._id
              ? { ...b, status: "CANCELLED" }
              : b
          )
        );
        setSelectedBookingForCancel(null);
        setToastMessage("Booking cancelled successfully.");

        setTimeout(() => setToastMessage(""), 4000);
      } else {
        alert(data.message || "Failed to cancel booking.");
      }
    } catch (err) {
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  // Filter bookings on client
  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === "HOTEL") return b.bookingType === "HOTEL";
    if (activeFilter === "GUIDE") return b.bookingType === "GUIDE";
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="success">CONFIRMED</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">CANCELLED</Badge>;
      case "COMPLETED":
        return <Badge variant="info">COMPLETED</Badge>;
      case "PENDING":
      default:
        return <Badge variant="warning">PENDING</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderLine space-y-6 shadow-sm">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-borderLine">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-xl text-primaryText flex items-center gap-2">
            <Calendar className="text-coral-500" size={20} />
            My Bookings
          </h2>
          <p className="text-xs text-bodyText">
            Manage your hotel reservations and local guide bookings.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-secondaryBg p-1 rounded-full border border-borderLine">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === "ALL"
                ? "bg-coral-500 text-white shadow-sm"
                : "text-bodyText hover:text-primaryText"
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setActiveFilter("HOTEL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === "HOTEL"
                ? "bg-coral-500 text-white shadow-sm"
                : "text-bodyText hover:text-primaryText"
            }`}
          >
            Hotels (
            {bookings.filter((b) => b.bookingType === "HOTEL").length})
          </button>
          <button
            onClick={() => setActiveFilter("GUIDE")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === "GUIDE"
                ? "bg-coral-500 text-white shadow-sm"
                : "text-bodyText hover:text-primaryText"
            }`}
          >
            Guides ({bookings.filter((b) => b.bookingType === "GUIDE").length})
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-700 text-xs animate-in fade-in duration-200">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} />
            {toastMessage}
          </span>
          <button
            onClick={() => setToastMessage("")}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. LOADING STATE */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-secondaryBg/60 border border-borderLine space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-borderLine shrink-0" />
                <div className="space-y-2 flex-grow">
                  <div className="w-3/4 h-4 bg-borderLine rounded" />
                  <div className="w-1/2 h-3 bg-borderLine rounded" />
                </div>
              </div>
              <div className="h-16 bg-borderLine/50 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* 2. ERROR STATE */}
      {!loading && error && (
        <div className="py-12 text-center bg-secondaryBg rounded-2xl border border-borderLine space-y-3">
          <AlertCircle size={32} className="mx-auto text-coral-500" />
          <p className="text-sm font-semibold text-primaryText">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchBookings}>
            <RefreshCw size={14} />
            Try Again
          </Button>
        </div>
      )}

      {/* 3. EMPTY STATE */}
      {!loading && !error && filteredBookings.length === 0 && (
        <div className="py-12 text-center bg-secondaryBg rounded-2xl border border-dashed border-borderLine space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-coral-100 text-coral-500 mx-auto flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-primaryText">
              No bookings yet
            </h3>
            <p className="text-xs text-mutedText">
              Your hotel reservations and local guide bookings will appear here.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/hotels">
              <Button variant="outline" size="sm">
                Explore Hotels
              </Button>
            </Link>
            <Link href="/guides">
              <Button variant="primary" size="sm">
                Explore Guides
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 4. ACTIVE BOOKING CARDS LIST */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((b) => {
            const isHotel = b.bookingType === "HOTEL";
            const currencySymbol = b.currency === "USD" ? "$" : "₹";

            const title = isHotel
              ? b.hotel?.name || "Hotel Booking"
              : b.guide?.name || "Local Guide Tour";

            const image = isHotel
              ? b.hotel?.image ||
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
              : b.guide?.profileImage ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";

            const location =
              b.destination?.name && b.destination?.country
                ? `${b.destination.name}, ${b.destination.country}`
                : isHotel
                ? b.hotel?.address || b.hotel?.country || "India"
                : b.guide?.country || "India";

            // Calculate nights for hotel if available
            let nightsCount = 1;
            if (isHotel && b.startDate && b.endDate) {
              const start = new Date(b.startDate);
              const end = new Date(b.endDate);
              if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
                nightsCount = Math.ceil(
                  (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                );
              }
            }

            const canCancel = b.status === "PENDING" || b.status === "CONFIRMED";

            return (
              <div
                key={b._id}
                className="bg-white rounded-2xl p-5 border border-borderLine space-y-4 shadow-sm hover:border-coral-300 transition-colors flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-start gap-3.5">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-borderLine bg-secondaryBg">
                    <Image
                      src={image}
                      alt={title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-grow space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={isHotel ? "coral" : "secondary"}
                        className="text-[10px]"
                      >
                        {isHotel ? "HOTEL" : "LOCAL GUIDE"}
                      </Badge>
                      {getStatusBadge(b.status)}
                    </div>
                    <h3 className="font-display font-bold text-base text-primaryText line-clamp-1">
                      {title}
                    </h3>
                    <p className="text-xs text-mutedText flex items-center gap-1">
                      <MapPin size={12} className="text-coral-500" />
                      {location}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="p-3.5 rounded-xl bg-secondaryBg border border-borderLine grid grid-cols-2 gap-3 text-xs">
                  {isHotel ? (
                    <>
                      <div>
                        <span className="text-mutedText block text-[10px] uppercase font-semibold">
                          Check-in
                        </span>
                        <span className="font-medium text-primaryText">
                          {formatDate(b.startDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-mutedText block text-[10px] uppercase font-semibold">
                          Check-out
                        </span>
                        <span className="font-medium text-primaryText">
                          {formatDate(b.endDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-mutedText block text-[10px] uppercase font-semibold">
                          Guests
                        </span>
                        <span className="font-medium text-primaryText">
                          {b.guests || 1} Guest(s)
                        </span>
                      </div>
                      <div>
                        <span className="text-mutedText block text-[10px] uppercase font-semibold">
                          Duration
                        </span>
                        <span className="font-medium text-primaryText">
                          {nightsCount} Night(s)
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-mutedText block text-[10px] uppercase font-semibold">
                          Tour Date
                        </span>
                        <span className="font-medium text-primaryText">
                          {formatDate(b.startDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-mutedText block text-[10px] uppercase font-semibold">
                          Duration
                        </span>
                        <span className="font-medium text-primaryText">
                          {b.hours || 1} Hour(s)
                        </span>
                      </div>
                      <div>
                        <span className="text-mutedText block text-[10px] uppercase font-semibold">
                          Guests
                        </span>
                        <span className="font-medium text-primaryText">
                          {b.guests || 1} Guest(s)
                        </span>
                      </div>
                      <div>
                        <span className="text-mutedText block text-[10px] uppercase font-semibold">
                          Rate Type
                        </span>
                        <span className="font-medium text-primaryText">Hourly Tour</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer Price & Cancel Action */}
                <div className="pt-3 border-t border-borderLine flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase text-mutedText font-semibold block">
                      Total Amount
                    </span>
                    <span className="font-display font-bold text-lg text-primaryText">
                      {currencySymbol}
                      {(b.totalAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBookingForCancel(b)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50"
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <CancelBookingModal
        booking={selectedBookingForCancel}
        isOpen={!!selectedBookingForCancel}
        onClose={() => setSelectedBookingForCancel(null)}
        onConfirm={handleConfirmCancel}
        loading={cancelLoading}
      />
    </div>
  );
}

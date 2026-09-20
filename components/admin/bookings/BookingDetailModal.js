"use client";

import React from "react";
import {
  X,
  CalendarCheck,
  User,
  MapPin,
  Hotel,
  Users,
  Clock,
  Calendar,
  CreditCard,
  ShieldCheck,
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

export default function BookingDetailModal({ booking, isOpen, onClose, onOpenStatusModal }) {
  if (!isOpen || !booking) return null;

  const isHotel = booking.bookingType === "HOTEL";
  const startDateFormatted = formatDate(booking.startDate);
  const endDateFormatted = booking.endDate ? formatDate(booking.endDate) : "N/A";

  // Calculate nights for hotel if available
  let nights = 1;
  if (isHotel && booking.startDate && booking.endDate) {
    const start = new Date(booking.startDate).getTime();
    const end = new Date(booking.endDate).getTime();
    if (!isNaN(start) && !isNaN(end) && end > start) {
      nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
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
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-borderLine shadow-2xl overflow-hidden my-8 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-borderLine bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-coral-500/20 text-coral-400 flex items-center justify-center font-bold">
              <CalendarCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-white">
                  Booking Details
                </h3>
                {getStatusBadge(booking.status)}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {booking._id}
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
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* 1. CUSTOMER INFORMATION */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-coral-600 uppercase tracking-wider">
              <User size={15} />
              <span>Customer Details</span>
            </div>
            <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-mutedText block">Customer Name</span>
                <span className="font-bold text-primaryText">{booking.user?.name || "Guest User"}</span>
              </div>
              <div>
                <span className="text-mutedText block">Email Address</span>
                <span className="font-bold text-primaryText">{booking.user?.email || "N/A"}</span>
              </div>
              <div>
                <span className="text-mutedText block">Phone Number</span>
                <span className="font-bold text-primaryText">{booking.user?.phone || "Not provided"}</span>
              </div>
              <div>
                <span className="text-mutedText block">Country</span>
                <span className="font-bold text-primaryText">{booking.user?.country || "India"}</span>
              </div>
            </div>
          </div>

          {/* 2. DESTINATION INFORMATION */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-coral-600 uppercase tracking-wider">
              <MapPin size={15} />
              <span>Destination</span>
            </div>
            <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-sm text-primaryText block">
                  {booking.destination?.name || "Target Destination"}
                </span>
                <span className="text-mutedText">
                  {booking.destination?.country || "India"} {booking.destination?.region ? `• ${booking.destination.region}` : ""}
                </span>
              </div>
              {booking.destination?.image && (
                <img
                  src={booking.destination.image}
                  alt={booking.destination.name || "Destination"}
                  className="w-12 h-12 rounded-xl object-cover border border-borderLine"
                />
              )}
            </div>
          </div>

          {/* 3. BOOKING SERVICE DETAILS (HOTEL OR GUIDE) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-coral-600 uppercase tracking-wider">
              {isHotel ? <Hotel size={15} /> : <Users size={15} />}
              <span>{isHotel ? "Hotel Stay Details" : "Local Guide Tour Details"}</span>
            </div>

            <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine space-y-4 text-xs">
              
              {/* Target Name Header */}
              <div className="flex items-center justify-between pb-3 border-b border-borderLine">
                <div>
                  <span className="text-mutedText block uppercase tracking-wider text-[10px] font-bold">
                    {isHotel ? "Selected Hotel" : "Assigned Local Guide"}
                  </span>
                  <span className="font-bold text-sm text-primaryText">
                    {isHotel ? booking.hotel?.name || "Hotel Reservation" : booking.guide?.name || "Local Guide Tour"}
                  </span>
                </div>
                <Badge variant={isHotel ? "teal" : "coral"} className="text-[11px]">
                  {isHotel ? "HOTEL STAY" : "GUIDE TOUR"}
                </Badge>
              </div>

              {/* Service Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {isHotel ? (
                  <>
                    <div>
                      <span className="text-mutedText block">Check-in</span>
                      <span className="font-semibold text-primaryText flex items-center gap-1 mt-0.5">
                        <Calendar size={13} className="text-coral-500" />
                        {startDateFormatted}
                      </span>
                    </div>
                    <div>
                      <span className="text-mutedText block">Check-out</span>
                      <span className="font-semibold text-primaryText flex items-center gap-1 mt-0.5">
                        <Calendar size={13} className="text-coral-500" />
                        {endDateFormatted}
                      </span>
                    </div>
                    <div>
                      <span className="text-mutedText block">Duration</span>
                      <span className="font-semibold text-primaryText mt-0.5 block">
                        {nights} {nights === 1 ? "Night" : "Nights"}
                      </span>
                    </div>
                    <div>
                      <span className="text-mutedText block">Guests</span>
                      <span className="font-semibold text-primaryText mt-0.5 block">
                        {booking.guests || 1} Guests
                      </span>
                    </div>
                    {booking.hotel?.pricePerNight && (
                      <div>
                        <span className="text-mutedText block">Rate / Night</span>
                        <span className="font-semibold text-primaryText mt-0.5 block">
                          {formatCurrency(booking.hotel.pricePerNight, booking.currency)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-mutedText block">Tour Date</span>
                      <span className="font-semibold text-primaryText flex items-center gap-1 mt-0.5">
                        <Calendar size={13} className="text-coral-500" />
                        {startDateFormatted}
                      </span>
                    </div>
                    <div>
                      <span className="text-mutedText block">Tour Duration</span>
                      <span className="font-semibold text-primaryText flex items-center gap-1 mt-0.5">
                        <Clock size={13} className="text-teal-600" />
                        {booking.hours || 1} {booking.hours === 1 ? "Hour" : "Hours"}
                      </span>
                    </div>
                    <div>
                      <span className="text-mutedText block">Guests</span>
                      <span className="font-semibold text-primaryText mt-0.5 block">
                        {booking.guests || 1} Guests
                      </span>
                    </div>
                    {booking.guide?.hourlyRate && (
                      <div>
                        <span className="text-mutedText block">Hourly Rate</span>
                        <span className="font-semibold text-primaryText mt-0.5 block">
                          {formatCurrency(booking.guide.hourlyRate, booking.currency)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          </div>

          {/* 4. FINANCIAL SUMMARY */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400">
                <CreditCard size={20} />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                  Total Financial Amount
                </span>
                <span className="text-xs text-slate-300">
                  Protected Historical Record
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-display text-emerald-400">
                {formatCurrency(booking.totalAmount, booking.currency)}
              </span>
            </div>
          </div>

          {/* Timestamp Notice */}
          <div className="flex items-center justify-between text-[11px] text-mutedText px-1">
            <span>Created: {formatDate(booking.createdAt)}</span>
            <span>Last Updated: {formatDate(booking.updatedAt)}</span>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-borderLine bg-secondaryBg flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

          {onOpenStatusModal && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onOpenStatusModal(booking);
              }}
            >
              Update Status
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}

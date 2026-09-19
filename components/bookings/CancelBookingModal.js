"use client";

import React from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CancelBookingModal({
  booking,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) {
  if (!isOpen || !booking) return null;

  const itemName =
    booking.bookingType === "HOTEL"
      ? booking.hotel?.name || "Hotel Reservation"
      : booking.guide?.name || "Local Guide Tour";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-borderLine shadow-xl p-6 sm:p-8 space-y-6 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-full text-mutedText hover:text-primaryText hover:bg-secondaryBg transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
          <AlertTriangle size={28} />
        </div>

        {/* Text Header */}
        <div className="space-y-2">
          <h3 className="font-display font-extrabold text-2xl text-primaryText">
            Cancel this booking?
          </h3>
          <p className="text-sm font-semibold text-coral-500">
            {itemName}
          </p>
          <p className="text-xs text-bodyText leading-relaxed">
            Are you sure you want to cancel this reservation? The booking status will be updated to CANCELLED.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={loading}
            className="w-full justify-center order-2 sm:order-1"
          >
            Keep Booking
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            disabled={loading}
            className="w-full justify-center bg-red-500 hover:bg-red-600 border-red-500 text-white order-1 sm:order-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Booking"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Calendar,
  Users,
  MapPin,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Hotel,
  ArrowRight,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function HotelBookingModal({ hotel, isOpen, onClose }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Set default dates on open (Check-in = tomorrow, Check-out = 3 days later)
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const checkIn = new Date(today);
      checkIn.setDate(today.getDate() + 1);

      const checkOut = new Date(today);
      checkOut.setDate(today.getDate() + 4);

      setStartDate(checkIn.toISOString().split("T")[0]);
      setEndDate(checkOut.toISOString().split("T")[0]);
      setGuests(2);
      setError("");
      setConfirmedBooking(null);
    }
  }, [isOpen]);

  if (!isOpen || !hotel) return null;

  const pricePerNight = hotel.pricePerNight || 18000;
  const currencySymbol = hotel.currency === "USD" ? "$" : "₹";
  const displayLocation =
    hotel.location ||
    (hotel.destination?.name
      ? `${hotel.destination.name}, ${hotel.country}`
      : hotel.country || "India");

  // Calculate nights and estimated total
  let numberOfNights = 0;
  let estimatedTotal = 0;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
      const diffTime = end.getTime() - start.getTime();
      numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      estimatedTotal = numberOfNights * pricePerNight;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!startDate || !endDate) {
      setError("Please select both Check-in and Check-out dates.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      setError("Check-out date must be strictly after Check-in date.");
      return;
    }

    if (guests < 1) {
      setError("Number of guests must be at least 1.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingType: "HOTEL",
          hotelId: hotel._id || hotel.id,
          startDate,
          endDate,
          guests,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setConfirmedBooking(data.data);
      } else {
        if (res.status === 401) {
          setError("Please sign in to complete your booking.");
        } else {
          setError(data.message || "Failed to create booking. Please try again.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-borderLine shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-primaryText shadow-sm border border-borderLine transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* 1. CONFIRMATION VIEW */}
        {confirmedBooking ? (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="font-display font-extrabold text-2xl text-primaryText">
                Booking Created Successfully!
              </h3>
              <p className="text-xs text-bodyText">
                Your reservation request is submitted and pending confirmation.
              </p>
            </div>

            {/* Booking Summary Box */}
            <div className="bg-secondaryBg rounded-2xl p-5 border border-borderLine space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-borderLine">
                  <Image
                    src={
                      hotel.image ||
                      hotel.imageUrl ||
                      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={hotel.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-primaryText">
                    {hotel.name}
                  </h4>
                  <p className="text-xs text-mutedText flex items-center gap-1">
                    <MapPin size={12} className="text-coral-500" />
                    {displayLocation}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-borderLine grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-mutedText block">Check-in</span>
                  <span className="font-semibold text-primaryText">{startDate}</span>
                </div>
                <div>
                  <span className="text-mutedText block">Check-out</span>
                  <span className="font-semibold text-primaryText">{endDate}</span>
                </div>
                <div>
                  <span className="text-mutedText block">Guests</span>
                  <span className="font-semibold text-primaryText">{guests} Guest(s)</span>
                </div>
                <div>
                  <span className="text-mutedText block">Status</span>
                  <Badge variant="warning" className="text-[10px]">
                    {confirmedBooking.status || "PENDING"}
                  </Badge>
                </div>
              </div>

              <div className="pt-3 border-t border-borderLine flex items-center justify-between">
                <span className="text-xs font-semibold text-bodyText">Total Amount</span>
                <span className="font-display font-bold text-xl text-primaryText">
                  {currencySymbol}
                  {confirmedBooking.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/dashboard" className="w-full">
                <Button variant="primary" size="md" className="w-full justify-center">
                  Go to Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="md"
                onClick={onClose}
                className="w-full justify-center"
              >
                Continue Exploring
              </Button>
            </div>
          </div>
        ) : (
          /* 2. FORM VIEW */
          <div className="overflow-y-auto">
            {/* Modal Header */}
            <div className="relative h-44 bg-secondaryBg">
              <Image
                src={
                  hotel.image ||
                  hotel.imageUrl ||
                  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
                }
                alt={hotel.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-5">
                <div className="text-white space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="coral" className="text-[10px]">
                      Hotel Stay
                    </Badge>
                    <span className="text-xs text-white/90 flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {hotel.rating || 4.8}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl leading-tight">
                    {hotel.name}
                  </h3>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <MapPin size={12} className="text-coral-400" />
                    {displayLocation}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-600 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Rate Callout */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondaryBg border border-borderLine">
                <span className="text-xs text-bodyText font-medium">Nightly Rate</span>
                <span className="font-display font-bold text-base text-primaryText">
                  {currencySymbol}
                  {pricePerNight.toLocaleString("en-IN")}{" "}
                  <span className="text-xs font-normal text-mutedText">/ night</span>
                </span>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-bodyText flex items-center gap-1">
                    <Calendar size={13} className="text-coral-500" />
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-secondaryBg border border-borderLine text-primaryText rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-coral-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-bodyText flex items-center gap-1">
                    <Calendar size={13} className="text-coral-500" />
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    className="w-full bg-secondaryBg border border-borderLine text-primaryText rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-coral-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Guests Counter */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondaryBg border border-borderLine">
                <span className="text-xs font-semibold text-bodyText flex items-center gap-1.5">
                  <Users size={15} className="text-coral-500" /> Number of Guests
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-borderLine flex items-center justify-center font-bold text-primaryText hover:border-coral-500 transition-colors"
                  >
                    -
                  </button>
                  <span className="font-semibold text-sm w-4 text-center">
                    {guests}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuests(guests + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-borderLine flex items-center justify-center font-bold text-primaryText hover:border-coral-500 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Estimated Total Calculation */}
              {numberOfNights > 0 && (
                <div className="pt-3 border-t border-borderLine space-y-2">
                  <div className="flex items-center justify-between text-xs text-bodyText">
                    <span>
                      {numberOfNights} night(s) × {currencySymbol}
                      {pricePerNight.toLocaleString("en-IN")}
                    </span>
                    <span>
                      {currencySymbol}
                      {estimatedTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold text-sm text-primaryText">
                      Estimated Total
                    </span>
                    <span className="font-display font-extrabold text-xl text-primaryText">
                      {currencySymbol}
                      {estimatedTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center mt-2"
                disabled={loading || numberOfNights <= 0}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing Booking...
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

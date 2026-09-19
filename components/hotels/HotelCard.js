"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, MapPin, Wifi, Coffee, Sparkles, Hotel, Calendar } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import HotelBookingModal from "@/components/bookings/HotelBookingModal";
import AuthPromptModal from "@/components/bookings/AuthPromptModal";

export default function HotelCard({ hotel }) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);

  const {
    id,
    _id,
    name,
    location,
    country,
    destination,
    pricePerNight = 18000,
    rating = 4.7,
    reviewCount,
    reviewsCount,
    image,
    imageUrl,
    amenities = ["Wifi", "Pool", "Breakfast"],
    featured,
    aiEligible,
  } = hotel;

  const displayImage =
    image ||
    imageUrl ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";
  const displayReviewCount = reviewCount ?? reviewsCount ?? 90;
  const displayLocation =
    location ||
    (destination?.name ? `${destination.name}, ${country}` : country);

  const handleBookClick = async () => {
    try {
      setCheckingAuth(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.authenticated) {
        setIsBookingOpen(true);
      } else {
        setIsAuthPromptOpen(true);
      }
    } catch (err) {
      setIsAuthPromptOpen(true);
    } finally {
      setCheckingAuth(false);
    }
  };

  return (
    <>
      <Card className="group flex flex-col h-full bg-white">
        <div className="relative w-full h-56 overflow-hidden bg-secondaryBg">
          <Image
            src={displayImage}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          {(featured || aiEligible) && (
            <div className="absolute top-3 left-3">
              <Badge variant="coral" className="shadow-md">
                <Sparkles size={12} />
                Curated Stay
              </Badge>
            </div>
          )}
          <div className="absolute bottom-3 right-3">
            <Badge variant="light" className="font-semibold text-xs">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {rating} <span className="text-mutedText">({displayReviewCount})</span>
            </Badge>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-grow justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-mutedText">
              <MapPin size={14} className="text-coral-500" />
              <span>{displayLocation}</span>
            </div>
            <h3 className="font-display font-bold text-lg text-primaryText group-hover:text-coral-500 transition-colors">
              {name}
            </h3>

            {/* Amenities icons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {amenities.map((item, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-secondaryBg text-bodyText border border-borderLine flex items-center gap-1"
                >
                  {item === "Wifi" && <Wifi size={12} />}
                  {item === "Breakfast" && <Coffee size={12} />}
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-borderLine flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase text-mutedText font-semibold block">
                Price per night
              </span>
              <span className="font-display font-bold text-lg text-primaryText">
                ₹{pricePerNight.toLocaleString("en-IN")}{" "}
                <span className="text-xs font-normal text-mutedText">/ night</span>
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleBookClick}
              disabled={checkingAuth}
            >
              <Calendar size={14} />
              Book Now
            </Button>
          </div>
        </div>
      </Card>

      {/* Booking Modal */}
      <HotelBookingModal
        hotel={hotel}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={isAuthPromptOpen}
        onClose={() => setIsAuthPromptOpen(false)}
      />
    </>
  );
}

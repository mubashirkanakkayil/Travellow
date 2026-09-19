"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, MapPin, Languages, CheckCircle2, Calendar } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import GuideBookingModal from "@/components/bookings/GuideBookingModal";
import AuthPromptModal from "@/components/bookings/AuthPromptModal";

export default function GuideCard({ guide }) {
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
    languages = ["English", "Local"],
    hourlyRate = 1500,
    rating = 4.9,
    reviewCount,
    reviewsCount,
    profileImage,
    imageUrl,
    bio,
    specialties = ["History", "Food Tour"],
    verified = true,
  } = guide;

  const displayImage =
    profileImage ||
    imageUrl ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
  const displayReviewCount = reviewCount ?? reviewsCount ?? 45;
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
        <div className="p-5 flex items-start gap-4 border-b border-borderLine bg-secondaryBg/50">
          <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm">
            <Image src={displayImage} alt={name} fill className="object-cover" />
          </div>
          <div className="flex flex-col flex-grow">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-primaryText flex items-center gap-1.5 group-hover:text-coral-500 transition-colors">
                {name}
                {verified && (
                  <CheckCircle2
                    size={16}
                    className="text-coral-500 fill-coral-100 shrink-0"
                  />
                )}
              </h3>
            </div>
            <p className="text-xs text-mutedText flex items-center gap-1 mt-0.5">
              <MapPin size={12} className="text-coral-500" />
              {displayLocation}
            </p>
            <div className="flex items-center gap-1 text-xs font-semibold text-primaryText mt-1.5">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span>{rating}</span>
              <span className="text-mutedText font-normal">
                ({displayReviewCount} reviews)
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-grow justify-between gap-4">
          <div className="space-y-3">
            <p className="text-bodyText text-xs leading-relaxed line-clamp-2">
              {bio}
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-mutedText">
                <Languages size={14} className="text-bodyText shrink-0" />
                <span className="text-bodyText">{languages.join(", ")}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {specialties.map((spec, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] py-0.5">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-borderLine flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase text-mutedText font-semibold block">
                Hourly rate
              </span>
              <span className="font-display font-bold text-lg text-primaryText">
                ₹{hourlyRate.toLocaleString("en-IN")}{" "}
                <span className="text-xs font-normal text-mutedText">/ hr</span>
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleBookClick}
              disabled={checkingAuth}
            >
              <Calendar size={14} />
              Book Guide
            </Button>
          </div>
        </div>
      </Card>

      {/* Guide Booking Modal */}
      <GuideBookingModal
        guide={guide}
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

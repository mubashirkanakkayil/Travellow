"use client";

import React, { useState } from "react";
import { Search, Calendar, Users, DollarSign, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";

export default function SearchBar() {
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("");
  const [guests, setGuests] = useState("2 Travelers");
  const [budget, setBudget] = useState("Balanced (₹25,000 - ₹75,000)");

  return (
    <div className="relative max-w-container mx-auto px-4 sm:px-6 lg:px-8 -mt-8 z-20">
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-borderLine shadow-xl">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center"
        >
          {/* Field 1: Destination */}
          <div className="flex flex-col gap-1 p-2 rounded-xl hover:bg-secondaryBg transition-colors border border-transparent hover:border-borderLine">
            <label className="text-[11px] font-bold text-coral-600 uppercase tracking-wider flex items-center gap-1">
              <MapPin size={13} />
              Destination
            </label>
            <input
              type="text"
              placeholder="e.g. Kerala, Bali, Tokyo..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-transparent text-primaryText font-medium text-sm focus:outline-none placeholder:text-mutedText"
            />
          </div>

          {/* Field 2: Dates */}
          <div className="flex flex-col gap-1 p-2 rounded-xl hover:bg-secondaryBg transition-colors border border-transparent hover:border-borderLine">
            <label className="text-[11px] font-bold text-coral-600 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={13} />
              Travel Dates
            </label>
            <input
              type="text"
              placeholder="Select dates"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              className="bg-transparent text-primaryText font-medium text-sm focus:outline-none placeholder:text-mutedText"
            />
          </div>

          {/* Field 3: Guests */}
          <div className="flex flex-col gap-1 p-2 rounded-xl hover:bg-secondaryBg transition-colors border border-transparent hover:border-borderLine">
            <label className="text-[11px] font-bold text-coral-600 uppercase tracking-wider flex items-center gap-1">
              <Users size={13} />
              Travelers
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="bg-transparent text-primaryText font-medium text-sm focus:outline-none cursor-pointer"
            >
              <option>1 Solo Traveler</option>
              <option>2 Travelers (Couple)</option>
              <option>3-5 Family / Group</option>
              <option>6+ Large Group</option>
            </select>
          </div>

          {/* Field 4: Budget Range */}
          <div className="flex flex-col gap-1 p-2 rounded-xl hover:bg-secondaryBg transition-colors border border-transparent hover:border-borderLine">
            <label className="text-[11px] font-bold text-coral-600 uppercase tracking-wider flex items-center gap-1">
              <DollarSign size={13} />
              Budget Preference
            </label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="bg-transparent text-primaryText font-medium text-sm focus:outline-none cursor-pointer"
            >
              <option>Economy (&lt; ₹25,000)</option>
              <option>Balanced (₹25,000 - ₹75,000)</option>
              <option>Luxury (₹75,000+)</option>
            </select>
          </div>

          {/* Search CTA */}
          <div className="lg:col-span-1 pt-1">
            <Button variant="primary" size="lg" className="w-full h-12 shadow-md">
              <Search size={18} />
              Search Trip
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

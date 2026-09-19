"use client";

import React, { useState, useEffect } from "react";
import HotelCard from "@/components/hotels/HotelCard";
import Input from "@/components/ui/Input";
import { Search, Hotel, Loader2, MapPin } from "lucide-react";

export default function HotelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHotels() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        const queryString = params.toString() ? `?${params.toString()}` : "";
        const res = await fetch(`/api/hotels${queryString}`);
        const data = await res.json();

        if (data.success) {
          setHotels(data.data);
        } else {
          setError("Failed to load hotels.");
        }
      } catch (err) {
        setError("Failed to load hotels.");
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchHotels();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="py-12 bg-white">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Page Header */}
        <div className="bg-secondaryBg rounded-3xl p-8 sm:p-12 border border-borderLine space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-coral-500 uppercase tracking-widest">
            <Hotel size={16} />
            <span>Accommodations Directory</span>
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-primaryText tracking-tight">
            Handpicked Stays & Luxury Resorts
          </h1>
          <p className="text-bodyText text-sm sm:text-base max-w-2xl">
            Discover verified hotels, heritage palaces, beachfront villas, and wellness resorts across our destinations.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <Input
            icon={Search}
            placeholder="Search hotel name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-coral-500">
            <Loader2 size={36} className="animate-spin" />
            <span className="text-sm font-medium text-bodyText">Querying MongoDB hotels...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-16 space-y-3 bg-secondaryBg rounded-2xl border border-borderLine">
            <p className="text-sm font-semibold text-primaryText">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && hotels.length === 0 && (
          <div className="text-center py-16 space-y-3 bg-secondaryBg rounded-2xl border border-borderLine">
            <MapPin size={36} className="mx-auto text-coral-500" />
            <h3 className="font-display font-bold text-lg text-primaryText">No hotels match your search</h3>
            <p className="text-xs text-mutedText">Try searching for "Kumarakom", "Maya Ubud", "Ritz-Carlton", or "Taj".</p>
          </div>
        )}

        {/* Hotels Grid */}
        {!loading && !error && hotels.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <HotelCard key={hotel._id || hotel.id} hotel={hotel} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

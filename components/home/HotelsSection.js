"use client";

import React, { useState, useEffect } from "react";
import HotelCard from "@/components/hotels/HotelCard";
import Button from "@/components/ui/Button";
import { Hotel as HotelIcon, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function HotelsSection() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHotels() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/hotels");
        const data = await res.json();

        if (data.success) {
          setHotels(data.data);
        } else {
          setError("Unable to load accommodations right now.");
        }
      } catch (err) {
        setError("Unable to load accommodations right now.");
      } finally {
        setLoading(false);
      }
    }

    fetchHotels();
  }, []);

  return (
    <section className="py-20 bg-secondaryBg border-y border-borderLine">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-coral-500 uppercase tracking-widest">
              <HotelIcon size={16} />
              <span>Handpicked Accommodations</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-primaryText tracking-tight">
              Featured Hotels & Luxury Resorts
            </h2>
            <p className="text-bodyText text-sm sm:text-base max-w-xl">
              Stay in verified boutique villas, beachfront resorts, and heritage hotels fetched live from database records.
            </p>
          </div>

          <Link href="/hotels">
            <Button variant="outline" size="md">
              Browse All Hotels
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-coral-500">
            <Loader2 size={32} className="animate-spin" />
            <span className="text-xs font-medium text-bodyText">Loading stays...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 text-center bg-white rounded-2xl border border-borderLine space-y-2">
            <p className="text-sm font-semibold text-primaryText">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && hotels.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-borderLine space-y-2">
            <p className="text-sm font-semibold text-primaryText">No hotel stays available right now.</p>
          </div>
        )}

        {/* Hotel Cards Grid */}
        {!loading && !error && hotels.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {hotels.slice(0, 4).map((hotel) => (
              <HotelCard key={hotel._id || hotel.id} hotel={hotel} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

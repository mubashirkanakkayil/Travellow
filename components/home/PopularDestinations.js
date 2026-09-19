"use client";

import React, { useState, useEffect } from "react";
import DestinationCard from "@/components/destinations/DestinationCard";
import Button from "@/components/ui/Button";
import { ArrowRight, Compass, Loader2 } from "lucide-react";
import Link from "next/link";

const regions = [
  { label: "All Regions", value: "ALL" },
  { label: "India", value: "INDIA" },
  { label: "Asia", value: "ASIA" },
  { label: "Europe", value: "EUROPE" },
];

export default function PopularDestinations() {
  const [activeRegion, setActiveRegion] = useState("ALL");
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDestinations() {
      try {
        setLoading(true);
        setError(null);
        const url = activeRegion === "ALL"
          ? "/api/destinations"
          : `/api/destinations?region=${activeRegion}`;
        
        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
          setDestinations(data.data);
        } else {
          setError("Unable to load destinations right now.");
        }
      } catch (err) {
        setError("Unable to load destinations right now.");
      } finally {
        setLoading(false);
      }
    }

    fetchDestinations();
  }, [activeRegion]);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-coral-500 uppercase tracking-widest">
              <Compass size={16} />
              <span>Curated Destinations</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-primaryText tracking-tight">
              Popular Destinations to Explore
            </h2>
            <p className="text-bodyText text-sm sm:text-base max-w-xl">
              Handpicked travel locations across India, Asia, and Europe fetched live from database records.
            </p>
          </div>

          {/* Region Tabs Filter */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-secondaryBg rounded-full border border-borderLine">
            {regions.map((reg) => (
              <button
                key={reg.value}
                onClick={() => setActiveRegion(reg.value)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeRegion === reg.value
                    ? "bg-coral-500 text-white shadow-sm"
                    : "text-bodyText hover:text-primaryText"
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-coral-500">
            <Loader2 size={32} className="animate-spin" />
            <span className="text-xs font-medium text-bodyText">Loading destinations...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 text-center bg-secondaryBg rounded-2xl border border-borderLine space-y-2">
            <p className="text-sm font-semibold text-primaryText">{error}</p>
            <p className="text-xs text-mutedText">Please check your internet connection and try refreshing.</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && destinations.length === 0 && (
          <div className="p-8 text-center bg-secondaryBg rounded-2xl border border-borderLine space-y-2">
            <p className="text-sm font-semibold text-primaryText">No destinations found in this region.</p>
          </div>
        )}

        {/* Destination Cards Grid */}
        {!loading && !error && destinations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.slice(0, 8).map((dest) => (
              <DestinationCard key={dest._id || dest.id} destination={dest} />
            ))}
          </div>
        )}

        {/* View All CTA */}
        <div className="mt-12 text-center">
          <Link href="/destinations">
            <Button variant="outline" size="lg">
              Explore All Destinations
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}

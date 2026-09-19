"use client";

import React, { useState, useEffect } from "react";
import DestinationCard from "@/components/destinations/DestinationCard";
import Input from "@/components/ui/Input";
import { Search, Compass, MapPin, Filter, Loader2 } from "lucide-react";

const regions = [
  { label: "All", value: "All" },
  { label: "India", value: "INDIA" },
  { label: "Asia", value: "ASIA" },
  { label: "Europe", value: "EUROPE" },
];

export default function DestinationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDestinations() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (selectedRegion !== "All") {
          params.append("region", selectedRegion);
        }
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        const queryString = params.toString() ? `?${params.toString()}` : "";
        const res = await fetch(`/api/destinations${queryString}`);
        const data = await res.json();

        if (data.success) {
          setDestinations(data.data);
        } else {
          setError("Failed to load destinations.");
        }
      } catch (err) {
        setError("Failed to load destinations.");
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchDestinations();
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedRegion, searchQuery]);

  return (
    <div className="py-12 bg-white">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Page Banner */}
        <div className="bg-secondaryBg rounded-3xl p-8 sm:p-12 border border-borderLine space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-coral-500 uppercase tracking-widest">
            <Compass size={16} />
            <span>Destinations Catalog</span>
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-primaryText tracking-tight">
            Explore Handpicked Travel Destinations
          </h1>
          <p className="text-bodyText text-sm sm:text-base max-w-2xl">
            Browse our curated destinations across India, Asia, and Europe fetched live from MongoDB Atlas records.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="w-full sm:w-80">
            <Input
              icon={Search}
              placeholder="Search destination or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Region Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-mutedText font-semibold flex items-center gap-1 mr-1">
              <Filter size={14} /> Region:
            </span>
            {regions.map((reg) => (
              <button
                key={reg.value}
                onClick={() => setSelectedRegion(reg.value)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  selectedRegion === reg.value
                    ? "bg-coral-500 text-white shadow-sm"
                    : "bg-secondaryBg text-bodyText hover:bg-white border border-borderLine"
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-coral-500">
            <Loader2 size={36} className="animate-spin" />
            <span className="text-sm font-medium text-bodyText">Querying MongoDB destinations...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-16 space-y-3 bg-secondaryBg rounded-2xl border border-borderLine">
            <p className="text-sm font-semibold text-primaryText">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && destinations.length === 0 && (
          <div className="text-center py-16 space-y-3 bg-secondaryBg rounded-2xl border border-borderLine">
            <MapPin size={36} className="mx-auto text-coral-500" />
            <h3 className="font-display font-bold text-lg text-primaryText">No destinations match your search</h3>
            <p className="text-xs text-mutedText">Try searching for "Kerala", "Bali", "Japan", or "Switzerland".</p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && !error && destinations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest) => (
              <DestinationCard key={dest._id || dest.id} destination={dest} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import DestinationCard from "@/components/destinations/DestinationCard";
import DestinationMap from "@/components/maps/DestinationMap";
import Input from "@/components/ui/Input";
import {
  Search,
  Compass,
  MapPin,
  Filter,
  Loader2,
  LayoutGrid,
  Map as MapIcon,
  Columns,
} from "lucide-react";

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
  
  // View mode state: "grid" | "map" | "split"
  const [viewMode, setViewMode] = useState("split");
  const [selectedDestinationId, setSelectedDestinationId] = useState(null);

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
    <div className="py-12 bg-white min-h-screen">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
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
            Browse our curated destinations across India, Asia, and Europe with interactive Google Maps location preview.
          </p>
        </div>

        {/* Filters, Search & View Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-borderLine">
          {/* Search Input */}
          <div className="w-full lg:w-80">
            <Input
              icon={Search}
              placeholder="Search destination or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 w-full lg:w-auto">
            {/* Region Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-mutedText font-semibold flex items-center gap-1 mr-1">
                <Filter size={14} /> Region:
              </span>
              {regions.map((reg) => (
                <button
                  key={reg.value}
                  onClick={() => setSelectedRegion(reg.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedRegion === reg.value
                      ? "bg-coral-500 text-white shadow-sm"
                      : "bg-secondaryBg text-bodyText hover:bg-white border border-borderLine"
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>

            {/* View Mode Selector: Grid | Map | Split */}
            <div className="flex items-center p-1 bg-secondaryBg rounded-xl border border-borderLine">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-primaryText shadow-sm"
                    : "text-mutedText hover:text-primaryText"
                }`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              
              <button
                onClick={() => setViewMode("split")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "split"
                    ? "bg-white text-primaryText shadow-sm"
                    : "text-mutedText hover:text-primaryText"
                }`}
                title="Split View"
              >
                <Columns size={15} />
                <span className="hidden sm:inline">Split</span>
              </button>

              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "map"
                    ? "bg-white text-primaryText shadow-sm"
                    : "text-mutedText hover:text-primaryText"
                }`}
                title="Map View"
              >
                <MapIcon size={15} />
                <span className="hidden sm:inline">Map</span>
              </button>
            </div>
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

        {/* Main Content Layout based on View Mode */}
        {!loading && !error && destinations.length > 0 && (
          <div>
            {/* GRID VIEW */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {destinations.map((dest) => (
                  <DestinationCard key={dest._id || dest.id} destination={dest} />
                ))}
              </div>
            )}

            {/* MAP VIEW */}
            {viewMode === "map" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-mutedText">
                  <span>Showing {destinations.length} mapped destinations</span>
                  <span>Click markers to view destination card preview</span>
                </div>
                <DestinationMap
                  destinations={destinations}
                  selectedDestinationId={selectedDestinationId}
                  onSelectDestination={(dest) => setSelectedDestinationId(dest._id || dest.id)}
                  className="h-[650px] w-full rounded-3xl overflow-hidden shadow-xl border border-borderLine"
                />
              </div>
            )}

            {/* SPLIT VIEW */}
            {viewMode === "split" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Cards List (Left / 7 cols) */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {destinations.map((dest) => {
                    const isSelected = selectedDestinationId === (dest._id || dest.id);
                    return (
                      <div
                        key={dest._id || dest.id}
                        onClick={() => setSelectedDestinationId(dest._id || dest.id)}
                        className={`transition-transform duration-200 rounded-2xl ${
                          isSelected ? "ring-2 ring-coral-500 scale-[1.02]" : ""
                        }`}
                      >
                        <DestinationCard destination={dest} />
                      </div>
                    );
                  })}
                </div>

                {/* Map View (Right / 5 cols - Sticky) */}
                <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-3">
                  <div className="flex items-center justify-between text-xs text-mutedText px-1">
                    <span className="font-semibold text-primaryText flex items-center gap-1">
                      <MapPin size={14} className="text-coral-500" /> Interactive Map
                    </span>
                    <span>{destinations.length} places</span>
                  </div>
                  <DestinationMap
                    destinations={destinations}
                    selectedDestinationId={selectedDestinationId}
                    onSelectDestination={(dest) => setSelectedDestinationId(dest._id || dest.id)}
                    className="h-[580px] w-full rounded-2xl overflow-hidden shadow-lg border border-borderLine"
                  />
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

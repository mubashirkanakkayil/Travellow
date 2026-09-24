"use me";
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GuideCard from "@/components/guides/GuideCard";
import Input from "@/components/ui/Input";
import { Search, UserCheck, Loader2, MapPin } from "lucide-react";

function GuidesListContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams ? searchParams.get("search") || "" : "";
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGuides() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        const queryString = params.toString() ? `?${params.toString()}` : "";
        const res = await fetch(`/api/guides${queryString}`);
        const data = await res.json();

        if (data.success) {
          setGuides(data.data);
        } else {
          setError("Failed to load local guides.");
        }
      } catch (err) {
        setError("Failed to load local guides.");
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchGuides();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="max-w-md">
        <Input
          icon={Search}
          placeholder="Search guide name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-coral-500">
          <Loader2 size={36} className="animate-spin" />
          <span className="text-sm font-medium text-bodyText">Querying MongoDB local guides...</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="text-center py-16 space-y-3 bg-secondaryBg rounded-2xl border border-borderLine">
          <p className="text-sm font-semibold text-primaryText">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && guides.length === 0 && (
        <div className="text-center py-16 space-y-3 bg-secondaryBg rounded-2xl border border-borderLine">
          <MapPin size={36} className="mx-auto text-coral-500" />
          <h3 className="font-display font-bold text-lg text-primaryText">No guides match your search</h3>
          <p className="text-xs text-mutedText">Try searching for "Rajesh", "Wayan", "Kenji", or "Elena".</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && guides.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <GuideCard key={guide._id || guide.id} guide={guide} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GuidesPage() {
  return (
    <div className="py-12 bg-white">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="bg-secondaryBg rounded-3xl p-8 sm:p-12 border border-borderLine space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-coral-500 uppercase tracking-widest">
            <UserCheck size={16} />
            <span>Local Guides Directory</span>
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-primaryText tracking-tight">
            Connect with Verified Local Tour Guides
          </h1>
          <p className="text-bodyText text-sm sm:text-base max-w-2xl">
            Book certified local experts, historians, and storytellers who bring each destination's culture and heritage to life.
          </p>
        </div>

        <Suspense fallback={
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-coral-500">
            <Loader2 size={36} className="animate-spin" />
            <span className="text-sm font-medium text-bodyText">Loading guides directory...</span>
          </div>
        }>
          <GuidesListContent />
        </Suspense>

      </div>
    </div>
  );
}

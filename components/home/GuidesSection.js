"use client";

import React, { useState, useEffect } from "react";
import GuideCard from "@/components/guides/GuideCard";
import Button from "@/components/ui/Button";
import { UserCheck, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function GuidesSection() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGuides() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/guides");
        const data = await res.json();

        if (data.success) {
          setGuides(data.data);
        } else {
          setError("Unable to load local guides right now.");
        }
      } catch (err) {
        setError("Unable to load local guides right now.");
      } finally {
        setLoading(false);
      }
    }

    fetchGuides();
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-coral-500 uppercase tracking-widest">
              <UserCheck size={16} />
              <span>Verified Local Expertise</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-primaryText tracking-tight">
              Connect with Trusted Local Guides
            </h2>
            <p className="text-bodyText text-sm sm:text-base max-w-xl">
              Unlock hidden spots, authentic traditions, and localized insider knowledge with vetted local tour guides.
            </p>
          </div>

          <Link href="/guides">
            <Button variant="outline" size="md">
              View All Local Guides
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-coral-500">
            <Loader2 size={32} className="animate-spin" />
            <span className="text-xs font-medium text-bodyText">Loading local guides...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 text-center bg-secondaryBg rounded-2xl border border-borderLine space-y-2">
            <p className="text-sm font-semibold text-primaryText">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && guides.length === 0 && (
          <div className="p-8 text-center bg-secondaryBg rounded-2xl border border-borderLine space-y-2">
            <p className="text-sm font-semibold text-primaryText">No local guides available right now.</p>
          </div>
        )}

        {/* Guides Cards Grid */}
        {!loading && !error && guides.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guides.slice(0, 3).map((guide) => (
              <GuideCard key={guide._id || guide.id} guide={guide} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

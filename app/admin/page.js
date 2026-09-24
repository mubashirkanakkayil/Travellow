"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  UserRound,
  MapPin,
  Hotel,
  Users,
  CalendarCheck,
  Star,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";

import StarRating from "@/components/reviews/StarRating";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const activeModule = searchParams.get("module");

  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/stats");
      const data = await res.json();

      if (res.ok && data.success) {
        setStatsData(data);
      } else {
        setError(data.error || "Failed to load admin statistics.");
      }
    } catch (err) {
      console.error("Admin stats fetch error:", err);
      setError("Unable to connect to admin server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle module placeholder view if user clicks non-dashboard items
  if (activeModule && activeModule !== "dashboard") {
    const moduleName =
      activeModule.charAt(0).toUpperCase() + activeModule.slice(1);

    return (
      <div className="space-y-6">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-borderLine text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-coral-50 text-coral-500 flex items-center justify-center mx-auto">
            <Sparkles size={28} />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="font-display font-extrabold text-2xl text-primaryText">
              {moduleName} Management
            </h2>
            <p className="text-bodyText text-sm leading-relaxed">
              This module is scheduled for full CRUD implementation in the upcoming Admin Phase.
            </p>
          </div>
          <Link href="/admin" className="inline-block">
            <Button variant="primary">
              <LayoutDashboard size={16} />
              Return to Admin Overview
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-borderLine shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-coral-500 uppercase tracking-widest">
            <LayoutDashboard size={16} />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-primaryText tracking-tight">
            Platform Overview & Live Analytics
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="gap-2 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-coral-500" : ""} />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="p-8 rounded-3xl bg-white border border-rose-200 text-center space-y-4 shadow-sm">
          <AlertCircle size={36} className="text-rose-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-primaryText">
              Failed to Load Admin Data
            </h3>
            <p className="text-xs text-mutedText">{error}</p>
          </div>
          <Button variant="primary" size="sm" onClick={fetchStats}>
            Try Again
          </Button>
        </div>
      )}

      {/* STATS CARDS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-6 rounded-3xl bg-white border border-borderLine space-y-3 animate-pulse">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-16 bg-slate-300 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        statsData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Users */}
            <div className="bg-white p-6 rounded-3xl border border-borderLine shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-mutedText uppercase tracking-wider block">
                  Total Users
                </span>
                <span className="font-display font-extrabold text-3xl text-primaryText">
                  {statsData.stats?.users || 0}
                </span>
                <span className="text-[11px] text-teal-600 font-semibold block">Registered Accounts</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <UserRound size={24} />
              </div>
            </div>

            {/* Total Destinations */}
            <div className="bg-white p-6 rounded-3xl border border-borderLine shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-mutedText uppercase tracking-wider block">
                  Total Destinations
                </span>
                <span className="font-display font-extrabold text-3xl text-primaryText">
                  {statsData.stats?.destinations || 0}
                </span>
                <span className="text-[11px] text-coral-600 font-semibold block">Mapped Global Places</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-coral-50 text-coral-500 flex items-center justify-center shrink-0">
                <MapPin size={24} />
              </div>
            </div>

            {/* Total Hotels */}
            <div className="bg-white p-6 rounded-3xl border border-borderLine shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-mutedText uppercase tracking-wider block">
                  Total Hotels
                </span>
                <span className="font-display font-extrabold text-3xl text-primaryText">
                  {statsData.stats?.hotels || 0}
                </span>
                <span className="text-[11px] text-amber-600 font-semibold block">Verified Stays</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Hotel size={24} />
              </div>
            </div>

            {/* Total Guides */}
            <div className="bg-white p-6 rounded-3xl border border-borderLine shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-mutedText uppercase tracking-wider block">
                  Total Guides
                </span>
                <span className="font-display font-extrabold text-3xl text-primaryText">
                  {statsData.stats?.guides || 0}
                </span>
                <span className="text-[11px] text-indigo-600 font-semibold block">Local Experts</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
            </div>

            {/* Total Bookings */}
            <div className="bg-white p-6 rounded-3xl border border-borderLine shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-mutedText uppercase tracking-wider block">
                  Total Bookings
                </span>
                <span className="font-display font-extrabold text-3xl text-primaryText">
                  {statsData.stats?.bookings || 0}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold block">Platform Reservations</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CalendarCheck size={24} />
              </div>
            </div>

            {/* Total Reviews */}
            <div className="bg-white p-6 rounded-3xl border border-borderLine shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-mutedText uppercase tracking-wider block">
                  Total Reviews
                </span>
                <span className="font-display font-extrabold text-3xl text-primaryText">
                  {statsData.stats?.reviews || 0}
                </span>
                <span className="text-[11px] text-amber-600 font-semibold block">Guest Feedbacks</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Star size={24} />
              </div>
            </div>
          </div>
        )
      )}

      {/* RECENT ACTIVITY GRID */}
      {!loading && statsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* RECENT BOOKINGS TABLE */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-borderLine shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-borderLine pb-4">
              <div className="flex items-center gap-2 font-display font-bold text-xl text-primaryText">
                <CalendarCheck size={20} className="text-emerald-600" />
                <span>Recent Bookings</span>
              </div>
              <Badge variant="emerald" className="text-xs">
                Live Activity
              </Badge>
            </div>

            {statsData.recentBookings && statsData.recentBookings.length > 0 ? (
              <div className="space-y-3">
                {statsData.recentBookings.map((b) => (
                  <div
                    key={b._id}
                    className="p-4 rounded-2xl bg-secondaryBg/60 border border-borderLine flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondaryBg transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-primaryText">{b.userName}</span>
                        <Badge variant={b.bookingType === "HOTEL" ? "coral" : "indigo"} className="text-[10px] py-0 px-2">
                          {b.bookingType}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-bodyText">
                        {b.targetName} {b.destinationName ? `(${b.destinationName})` : ""}
                      </p>
                      <span className="text-[11px] text-mutedText flex items-center gap-1">
                        <Clock size={11} /> {formatDate(b.startDate)}
                      </span>
                    </div>

                    <div className="sm:text-right font-display font-bold text-base text-primaryText">
                      ₹{b.totalAmount?.toLocaleString("en-IN")}
                      <span className="block text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-secondaryBg/40 rounded-2xl border border-borderLine space-y-2">
                <CalendarCheck size={28} className="mx-auto text-mutedText" />
                <p className="text-xs font-semibold text-mutedText">No bookings yet.</p>
              </div>
            )}
          </div>

          {/* RECENT REVIEWS TABLE */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-borderLine shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-borderLine pb-4">
              <div className="flex items-center gap-2 font-display font-bold text-xl text-primaryText">
                <Star size={20} className="text-amber-500" />
                <span>Recent Reviews</span>
              </div>
              <Badge variant="coral" className="text-xs">
                Community Feedback
              </Badge>
            </div>

            {statsData.recentReviews && statsData.recentReviews.length > 0 ? (
              <div className="space-y-3">
                {statsData.recentReviews.map((r) => (
                  <div
                    key={r._id}
                    className="p-4 rounded-2xl bg-secondaryBg/60 border border-borderLine space-y-2 hover:bg-secondaryBg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-primaryText">{r.userName}</span>
                        <span className="text-xs text-mutedText">• {r.targetName} ({r.targetType})</span>
                      </div>
                      <StarRating rating={r.rating} size={14} />
                    </div>

                    <p className="text-xs text-bodyText line-clamp-2 italic">
                      &ldquo;{r.comment}&rdquo;
                    </p>

                    <span className="text-[11px] text-mutedText block text-right">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-secondaryBg/40 rounded-2xl border border-borderLine space-y-2">
                <MessageSquare size={28} className="mx-auto text-mutedText" />
                <p className="text-xs font-semibold text-mutedText">No reviews yet.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

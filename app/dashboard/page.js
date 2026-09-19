import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import MyBookingsSection from "@/components/dashboard/MyBookingsSection";
import {
  User,
  Mail,
  Globe,
  DollarSign,
  Sparkles,
  Star,
  Compass,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="py-12 bg-white min-h-[85vh]">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Welcome Banner */}
        <div className="bg-secondaryBg rounded-3xl p-8 sm:p-12 border border-borderLine flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-coral-500 uppercase tracking-widest">
              <Compass size={16} />
              <span>User Dashboard</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-primaryText tracking-tight">
              Welcome back, {user.name}!
            </h1>
            <p className="text-bodyText text-sm sm:text-base max-w-xl">
              Manage your travel account preferences, view your saved itineraries, and track upcoming reservations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/trip-planner">
              <Button variant="primary" size="md">
                <Sparkles size={16} />
                AI Trip Planner
              </Button>
            </Link>
          </div>
        </div>

        {/* User Account Information Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderLine space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-borderLine">
            <h2 className="font-display font-bold text-xl text-primaryText flex items-center gap-2">
              <User className="text-coral-500" size={20} />
              Account Details
            </h2>
            <Badge variant={user.role === "ADMIN" ? "coral" : "neutral"}>
              {user.role}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Name */}
            <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine space-y-1">
              <span className="text-xs text-mutedText font-medium flex items-center gap-1.5">
                <User size={14} className="text-coral-500" /> Full Name
              </span>
              <p className="font-semibold text-primaryText text-base">{user.name}</p>
            </div>

            {/* Email */}
            <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine space-y-1">
              <span className="text-xs text-mutedText font-medium flex items-center gap-1.5">
                <Mail size={14} className="text-coral-500" /> Email Address
              </span>
              <p className="font-semibold text-primaryText text-base truncate">{user.email}</p>
            </div>

            {/* Country */}
            <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine space-y-1">
              <span className="text-xs text-mutedText font-medium flex items-center gap-1.5">
                <Globe size={14} className="text-coral-500" /> Country
              </span>
              <p className="font-semibold text-primaryText text-base">{user.country || "India"}</p>
            </div>

            {/* Preferred Currency */}
            <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine space-y-1">
              <span className="text-xs text-mutedText font-medium flex items-center gap-1.5">
                <DollarSign size={14} className="text-coral-500" /> Preferred Currency
              </span>
              <p className="font-semibold text-primaryText text-base">{user.preferredCurrency || "INR"}</p>
            </div>
          </div>
        </div>

        {/* Real My Bookings Interactive Section */}
        <MyBookingsSection />

        {/* Future Feature Placeholders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* AI Trip Plans Placeholder */}
          <div className="bg-white rounded-3xl p-6 border border-borderLine space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-coral-100 text-coral-500 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <h3 className="font-display font-bold text-lg text-primaryText">AI Trip Plans</h3>
              <p className="text-xs text-bodyText leading-relaxed">
                Saved custom travel itineraries generated by Travellow AI assistant.
              </p>
            </div>
            <div className="py-6 text-center bg-secondaryBg rounded-2xl border border-dashed border-borderLine space-y-2">
              <Sparkles size={24} className="mx-auto text-mutedText" />
              <p className="text-xs text-mutedText font-medium">No saved AI itineraries yet</p>
              <Link
                href="/trip-planner"
                className="inline-block text-xs font-semibold text-coral-500 hover:underline"
              >
                Create AI Itinerary →
              </Link>
            </div>
          </div>

          {/* Reviews Placeholder */}
          <div className="bg-white rounded-3xl p-6 border border-borderLine space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-coral-100 text-coral-500 flex items-center justify-center">
                <Star size={20} />
              </div>
              <h3 className="font-display font-bold text-lg text-primaryText">My Reviews</h3>
              <p className="text-xs text-bodyText leading-relaxed">
                Ratings and reviews submitted for destinations, hotels, and guides.
              </p>
            </div>
            <div className="py-6 text-center bg-secondaryBg rounded-2xl border border-dashed border-borderLine space-y-2">
              <Star size={24} className="mx-auto text-mutedText" />
              <p className="text-xs text-mutedText font-medium">No submitted reviews</p>
              <Link
                href="/destinations"
                className="inline-block text-xs font-semibold text-coral-500 hover:underline"
              >
                Explore Destinations →
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

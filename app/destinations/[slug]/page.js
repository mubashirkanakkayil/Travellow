"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  MapPin,
  Star,
  Compass,
  Calendar,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Hotel,
  Users,
  Bot,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sun,
  ShieldCheck,
} from "lucide-react";

import DestinationMap from "@/components/maps/DestinationMap";
import WeatherCard from "@/components/weather/WeatherCard";
import HotelCard from "@/components/hotels/HotelCard";
import GuideCard from "@/components/guides/GuideCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function DestinationDetailPage({ params: initialParams }) {
  const routerParams = useParams();
  const rawSlug = initialParams?.slug || routerParams?.slug || "";
  const [slug, setSlug] = useState(rawSlug);
  const [destination, setDestination] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const currentSlug = initialParams?.slug || routerParams?.slug;
    if (currentSlug) {
      setSlug(currentSlug);
    } else if (typeof window !== "undefined") {
      const pathParts = window.location.pathname.split("/");
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart !== "destinations") {
        setSlug(lastPart);
      }
    }
  }, [initialParams, routerParams]);

  useEffect(() => {
    if (!slug) return;

    async function fetchDestinationData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch Destination details
        const destRes = await fetch(`/api/destinations/${slug}`);
        const destData = await destRes.json();

        if (!destData.success || !destData.data) {
          setError("Destination not found.");
          setLoading(false);
          return;
        }

        const destObj = destData.data;
        setDestination(destObj);

        // Fetch Hotels for this destination in parallel
        const targetIdOrSlug = destObj.slug || destObj._id;
        const hotelsRes = await fetch(`/api/hotels?destination=${targetIdOrSlug}`);
        const hotelsData = await hotelsRes.json();
        if (hotelsData.success) {
          setHotels(hotelsData.data || []);
        }

        // Fetch Guides for this destination in parallel
        const guidesRes = await fetch(`/api/guides?destination=${targetIdOrSlug}`);
        const guidesData = await guidesRes.json();
        if (guidesData.success) {
          setGuides(guidesData.data || []);
        }
      } catch (err) {
        console.error("Error loading destination detail:", err);
        setError("Failed to load destination details.");
      } finally {
        setLoading(false);
      }
    }

    fetchDestinationData();
  }, [slug]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="py-12 bg-white min-h-screen">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
          {/* Breadcrumb & Back button skeleton */}
          <div className="h-6 w-48 bg-slate-200 rounded-md" />
          
          {/* Hero Banner Skeleton */}
          <div className="w-full h-96 bg-slate-200 rounded-3xl" />
          
          {/* Main Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 rounded" />
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="h-24 bg-slate-100 rounded-2xl" />
                <div className="h-24 bg-slate-100 rounded-2xl" />
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="h-80 w-full bg-slate-200 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error / Destination Not Found State
  if (error || !destination) {
    return (
      <div className="py-24 bg-white min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center space-y-6 bg-secondaryBg p-8 sm:p-12 rounded-3xl border border-borderLine shadow-sm">
          <div className="w-16 h-16 rounded-full bg-coral-50 text-coral-500 flex items-center justify-center mx-auto">
            <Compass size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-2xl text-primaryText">
              Destination Not Found
            </h2>
            <p className="text-bodyText text-sm leading-relaxed">
              We couldn't find the destination you were looking for. It might have been moved or removed.
            </p>
          </div>
          <Link href="/destinations" className="inline-block">
            <Button variant="primary">
              <ArrowLeft size={16} />
              Back to Destinations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const {
    name,
    country,
    region,
    description,
    shortDescription,
    image,
    gallery = [],
    rating = 4.8,
    reviewCount = 120,
    startingPrice = 35000,
    currency = "INR",
    bestTimeToVisit,
    activities = [],
    highlights = [],
    latitude,
    longitude,
  } = destination;

  const displayImage =
    image ||
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="bg-white min-h-screen pb-20">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 text-xs text-mutedText font-medium">
          <Link href="/" className="hover:text-coral-500 transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/destinations" className="hover:text-coral-500 transition-colors">Destinations</Link>
          <ChevronRight size={12} />
          <span className="text-primaryText font-semibold">{name}</span>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[540px] rounded-3xl overflow-hidden shadow-2xl bg-slate-900 group">
          <Image
            src={displayImage}
            alt={name}
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/20" />

          {/* Top Badges */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <Link
              href="/destinations"
              className="inline-flex items-center gap-1.5 bg-white/80 hover:bg-white backdrop-blur-md text-primaryText text-xs font-semibold px-3.5 py-2 rounded-full transition-all shadow-md"
            >
              <ArrowLeft size={14} />
              <span>All Destinations</span>
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="coral" className="shadow-md">
                {region}
              </Badge>
            </div>
          </div>

          {/* Hero Details (Bottom) */}
          <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 text-white space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-coral-300">
              <MapPin size={14} className="text-coral-400" />
              <span>{country}</span>
              <span className="text-white/40">•</span>
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star size={13} className="fill-amber-400" />
                <span>{rating}</span>
                <span className="text-white/70 font-normal">({reviewCount} reviews)</span>
              </div>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
              {name}
            </h1>

            {shortDescription && (
              <p className="text-white/80 text-sm sm:text-base max-w-2xl font-light line-clamp-2 leading-relaxed">
                {shortDescription}
              </p>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl">
                <span className="text-[10px] uppercase text-white/70 block tracking-wider font-semibold">Starting from</span>
                <span className="font-display font-extrabold text-xl sm:text-2xl text-white">
                  ₹{startingPrice.toLocaleString("en-IN")} <span className="text-xs font-normal text-white/70">/ person</span>
                </span>
              </div>

              <Link
                href={`/trip-planner?destination=${encodeURIComponent(name)}`}
                className="inline-flex items-center gap-2 bg-coral-500 hover:bg-coral-600 text-white font-semibold text-sm px-5 py-3 rounded-2xl shadow-lg transition-colors"
              >
                <Bot size={16} />
                <span>Plan Trip with AI</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Gallery Thumbnails (if available) */}
        {gallery && gallery.length > 0 && (
          <div className="grid grid-cols-4 gap-3 pt-2">
            {gallery.slice(0, 4).map((imgUrl, idx) => (
              <div key={idx} className="relative h-24 rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-borderLine">
                <Image src={imgUrl} alt={`${name} preview ${idx + 1}`} fill className="object-cover hover:scale-110 transition-transform duration-300" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Description & Highlights (7 cols) */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Full Description */}
            <div className="space-y-4">
              <h2 className="font-display font-extrabold text-2xl text-primaryText tracking-tight">
                About {name}
              </h2>
              <p className="text-bodyText text-base leading-relaxed whitespace-pre-line">
                {description || shortDescription}
              </p>
            </div>

            {/* Quick Specs Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bestTimeToVisit && (
                <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-coral-50 text-coral-500 shrink-0">
                    <Sun size={20} />
                  </div>
                  <div>
                    <span className="text-xs text-mutedText font-semibold block uppercase tracking-wider">Best Time to Visit</span>
                    <span className="font-display font-bold text-sm text-primaryText mt-0.5 block">{bestTimeToVisit}</span>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <span className="text-xs text-mutedText font-semibold block uppercase tracking-wider">Travellow Guarantee</span>
                  <span className="font-display font-bold text-sm text-primaryText mt-0.5 block">Verified Local Partners</span>
                </div>
              </div>
            </div>

            {/* Highlights Checklist */}
            {highlights && highlights.length > 0 && (
              <div className="space-y-4 bg-secondaryBg/40 p-6 rounded-3xl border border-borderLine">
                <h3 className="font-display font-bold text-lg text-primaryText flex items-center gap-2">
                  <Sparkles size={18} className="text-coral-500" />
                  Key Highlights
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm text-primaryText font-medium">
                      <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities Tags */}
            {activities && activities.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-display font-bold text-sm text-mutedText uppercase tracking-wider">
                  Popular Activities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activities.map((act, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full bg-white text-primaryText text-xs font-semibold border border-borderLine shadow-sm flex items-center gap-1.5"
                    >
                      <Sparkles size={12} className="text-coral-500" />
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Weather, Google Map & Quick Booking Sidebar (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            
            {/* Live Weather Card */}
            <WeatherCard
              latitude={latitude}
              longitude={longitude}
              destinationName={name}
            />

            {/* Google Map Box */}
            <div className="bg-white p-4 rounded-3xl border border-borderLine shadow-lg space-y-3">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-sm font-bold text-primaryText">
                  <MapPin size={16} className="text-coral-500" />
                  <span>Location Map</span>
                </div>
                <span className="text-xs text-mutedText">{country}</span>
              </div>

              <DestinationMap
                destinations={[destination]}
                selectedDestinationId={destination._id || destination.id}
                className="h-[320px] w-full rounded-2xl overflow-hidden shadow-inner border border-borderLine"
              />
            </div>

            {/* AI Trip Planner Promo Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-coral-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 text-coral-400 font-bold text-xs uppercase tracking-widest">
                <Bot size={16} />
                <span>AI Travel Assistant</span>
              </div>
              <h3 className="font-display font-bold text-xl text-white">
                Customize your trip to {name}
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Generate an intelligent day-by-day travel plan featuring top spots, verified hotels, and local guide suggestions.
              </p>
              <Link
                href={`/trip-planner?destination=${encodeURIComponent(name)}`}
                className="inline-flex items-center justify-center gap-2 w-full bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors shadow-md"
              >
                <Bot size={14} />
                <span>Open AI Trip Planner</span>
              </Link>
            </div>

          </div>
        </div>

        {/* HOTELS SECTION */}
        <div className="pt-8 border-t border-borderLine space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-coral-500 uppercase tracking-widest mb-1">
                <Hotel size={15} />
                <span>Accommodations</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-primaryText tracking-tight">
                Hotels & Resorts in {name}
              </h2>
            </div>
            <span className="text-xs text-mutedText font-medium">
              {hotels.length} stays available
            </span>
          </div>

          {hotels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <HotelCard key={hotel._id || hotel.id} hotel={hotel} />
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center bg-secondaryBg rounded-3xl border border-borderLine space-y-3">
              <Hotel size={36} className="mx-auto text-mutedText" />
              <h4 className="font-display font-bold text-base text-primaryText">
                No Travellow-listed hotels available for this destination yet.
              </h4>
              <p className="text-xs text-mutedText max-w-sm mx-auto">
                We are actively curating premium stays for {name}. Check back soon or request custom stay options via AI Trip Planner.
              </p>
            </div>
          )}
        </div>

        {/* GUIDES SECTION */}
        <div className="pt-8 border-t border-borderLine space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-coral-500 uppercase tracking-widest mb-1">
                <Users size={15} />
                <span>Local Experts</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-primaryText tracking-tight">
                Verified Local Guides in {name}
              </h2>
            </div>
            <span className="text-xs text-mutedText font-medium">
              {guides.length} guides available
            </span>
          </div>

          {guides.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide) => (
                <GuideCard key={guide._id || guide.id} guide={guide} />
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center bg-secondaryBg rounded-3xl border border-borderLine space-y-3">
              <Users size={36} className="mx-auto text-mutedText" />
              <h4 className="font-display font-bold text-base text-primaryText">
                No Travellow-listed local guides available for this destination yet.
              </h4>
              <p className="text-xs text-mutedText max-w-sm mx-auto">
                We are onboarding verified expert guides in {name}. Explore other destinations or generate custom tips with our AI.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

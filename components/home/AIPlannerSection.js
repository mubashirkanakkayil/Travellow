"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  Calendar,
  DollarSign,
  Heart,
  Compass,
  CheckCircle,
  Loader2,
  AlertCircle,
  Users,
  MapPin,
  Star,
  Hotel as HotelIcon,
  UserCheck,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Sun,
  Sunset,
  Moon,
  CloudSun,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import HotelBookingModal from "@/components/bookings/HotelBookingModal";
import GuideBookingModal from "@/components/bookings/GuideBookingModal";
import AuthPromptModal from "@/components/bookings/AuthPromptModal";

const POPULAR_DESTINATIONS = [
  "Goa",
  "Kerala",
  "Jaipur",
  "Bali",
  "Kyoto",
  "Paris",
  "Swiss Alps",
  "Tokyo",
];

const TRAVEL_STYLES = [
  "Budget",
  "Comfortable",
  "Luxury",
  "Adventure",
  "Relaxed",
];

const INTEREST_OPTIONS = [
  "Nature",
  "Beaches",
  "Culture",
  "Food",
  "Adventure",
  "Shopping",
  "History",
  "Photography",
];

export default function AIPlannerSection() {
  // Authentication State: "loading" | "authenticated" | "unauthenticated"
  const [authStatus, setAuthStatus] = useState("loading");
  const [authUser, setAuthUser] = useState(null);

  // Form State
  const [destination, setDestination] = useState("Goa");
  const [customDestination, setCustomDestination] = useState("");
  const [duration, setDuration] = useState(5);
  const [budget, setBudget] = useState(30000);
  const [travelers, setTravelers] = useState(2);
  const [travelStyle, setTravelStyle] = useState("Comfortable");
  const [selectedInterests, setSelectedInterests] = useState([
    "Beaches",
    "Food",
    "Culture",
  ]);

  // Execution State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [planResult, setPlanResult] = useState(null);

  // Modal Control State
  const [selectedHotelForBooking, setSelectedHotelForBooking] = useState(null);
  const [selectedGuideForBooking, setSelectedGuideForBooking] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 1. Initial Authentication Check on Mount
  useEffect(() => {
    async function checkAuth() {
      try {
        setAuthStatus("loading");
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setAuthStatus("authenticated");
            setAuthUser(data.user);
            return;
          }
        }
        setAuthStatus("unauthenticated");
        setAuthUser(null);
      } catch (err) {
        setAuthStatus("unauthenticated");
        setAuthUser(null);
      }
    }
    checkAuth();
  }, []);

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleDestinationSelect = (destName) => {
    setDestination(destName);
    setCustomDestination("");
  };

  // 2. Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const targetDestination = customDestination.trim() || destination;
    if (!targetDestination) {
      setError("Please select or type a destination.");
      return;
    }

    try {
      setLoading(true);

      // Verify authentication status using /api/auth/me
      const authRes = await fetch("/api/auth/me");
      let isAuthenticated = false;

      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.authenticated && authData.user) {
          isAuthenticated = true;
          setAuthStatus("authenticated");
          setAuthUser(authData.user);
        } else {
          setAuthStatus("unauthenticated");
          setAuthUser(null);
        }
      } else {
        setAuthStatus("unauthenticated");
        setAuthUser(null);
      }

      // If user is not authenticated, display the AuthPromptModal and stop
      if (!isAuthenticated) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }

      // Submit request to AI Trip Planner API
      const res = await fetch("/api/ai/trip-planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: targetDestination,
          duration: Number(duration),
          budget: Number(budget),
          travelers: Number(travelers),
          travelStyle,
          interests: selectedInterests,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPlanResult(data.data);
      } else {
        if (res.status === 401) {
          setAuthStatus("unauthenticated");
          setAuthUser(null);
          setShowAuthModal(true);
        } else {
          setError(data.message || "Failed to generate AI trip plan.");
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPlanResult(null);
    setError("");
  };

  return (
    <section className="py-16 bg-secondaryBg border-t border-borderLine relative overflow-hidden">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Modals */}
        <AuthPromptModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />

        <HotelBookingModal
          hotel={selectedHotelForBooking}
          isOpen={!!selectedHotelForBooking}
          onClose={() => setSelectedHotelForBooking(null)}
        />

        <GuideBookingModal
          guide={selectedGuideForBooking}
          isOpen={!!selectedGuideForBooking}
          onClose={() => setSelectedGuideForBooking(null)}
        />

        {/* SECTION HEADER (Visible when no result yet) */}
        {!planResult && (
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center gap-2">
              <Badge variant="coral">
                <Sparkles size={14} />
                Real Gemini AI Powered
              </Badge>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-primaryText tracking-tight">
              Create Your Grounded Travel Itinerary
            </h2>
            <p className="text-bodyText text-sm sm:text-base leading-relaxed">
              Tell our AI your travel details. Gemini will construct a personalized itinerary using verified accommodations and local guides directly from Travellow&apos;s database.
            </p>
          </div>
        )}

        {/* 1. PLANNER GENERATION FORM */}
        {!planResult ? (
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-borderLine shadow-xl space-y-8">
            <div className="flex items-center justify-between border-b border-borderLine pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-coral-100 text-coral-600 flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-primaryText">
                    AI Travel Preferences
                  </h3>
                  <p className="text-xs text-mutedText">
                    Grounded in Travellow Database
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Powered by Gemini AI
              </Badge>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-600 text-xs sm:text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Destination Input */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-primaryText uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-coral-500" />
                  1. Destination
                </label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_DESTINATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => handleDestinationSelect(loc)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                        destination === loc && !customDestination
                          ? "bg-coral-50 border-coral-500 text-coral-600 font-semibold shadow-sm"
                          : "border-borderLine text-bodyText hover:bg-secondaryBg"
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Or type custom destination (e.g. Jaipur, Bali, Paris)..."
                    value={customDestination}
                    onChange={(e) => {
                      setCustomDestination(e.target.value);
                      setDestination(e.target.value);
                    }}
                    className="w-full bg-secondaryBg border border-borderLine rounded-xl px-4 py-2.5 text-xs sm:text-sm text-primaryText focus:outline-none focus:border-coral-500"
                  />
                </div>
              </div>

              {/* Duration, Budget, Travelers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-primaryText uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-coral-500" />
                    Duration (Days)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-secondaryBg border border-borderLine rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-primaryText focus:outline-none focus:border-coral-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14].map((d) => (
                      <option key={d} value={d}>
                        {d} {d === 1 ? "Day" : "Days"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-primaryText uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={14} className="text-coral-500" />
                    Est. Budget (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="5000"
                    step="5000"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-secondaryBg border border-borderLine rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-primaryText focus:outline-none focus:border-coral-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-primaryText uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-coral-500" />
                    Travelers
                  </label>
                  <select
                    value={travelers}
                    onChange={(e) => setTravelers(Number(e.target.value))}
                    className="w-full bg-secondaryBg border border-borderLine rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-primaryText focus:outline-none focus:border-coral-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => (
                      <option key={t} value={t}>
                        {t} {t === 1 ? "Person" : "Travelers"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Travel Style */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-primaryText uppercase tracking-wider flex items-center gap-1.5">
                  <Heart size={14} className="text-coral-500" />
                  Travel Style & Vibe
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {TRAVEL_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setTravelStyle(style)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        travelStyle === style
                          ? "bg-coral-50 border-coral-500 text-coral-600 font-semibold shadow-sm"
                          : "border-borderLine text-bodyText hover:bg-secondaryBg"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-primaryText uppercase tracking-wider flex items-center gap-1.5">
                  <Compass size={14} className="text-coral-500" />
                  Interests & Activities (Select multiple)
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => {
                    const active = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                          active
                            ? "bg-coral-500 text-white border-coral-500 shadow-sm"
                            : "bg-white border-borderLine text-bodyText hover:bg-secondaryBg"
                        }`}
                      >
                        {active && <CheckCircle size={12} />}
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center shadow-lg shadow-coral-500/20 py-3.5 text-base"
                disabled={loading || authStatus === "loading"}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating your personalized trip with Gemini AI...
                  </>
                ) : authStatus === "loading" ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Checking authentication...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate AI Travel Plan
                  </>
                )}
              </Button>
            </form>
          </div>
        ) : (
          /* 2. ITINERARY RESULTS DISPLAY */
          <div className="space-y-10 animate-in fade-in duration-300">
            {/* Top Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-borderLine shadow-sm">
              <div className="flex items-center gap-3">
                <Badge variant="coral" className="text-xs">
                  <Sparkles size={13} /> AI Plan Generated
                </Badge>
                <span className="text-xs text-mutedText">
                  Grounded in Travellow Database
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw size={14} /> Plan Another Trip
              </Button>
            </div>

            {/* Trip Overview Banner */}
            <div className="bg-gradient-to-r from-primaryText via-gray-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-coral-500/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-coral-400 uppercase tracking-widest">
                    Your Personalized Itinerary
                  </span>
                  <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
                    {planResult.destination?.name}, {planResult.destination?.country}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-center">
                    <span className="text-[10px] text-white/70 block uppercase font-bold">Duration</span>
                    <span className="font-bold text-sm text-white">{planResult.duration} Days</span>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-center">
                    <span className="text-[10px] text-white/70 block uppercase font-bold">Est. Budget</span>
                    <span className="font-bold text-sm text-coral-400">
                      ₹{planResult.estimatedBudget?.amount?.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-3xl">
                {planResult.summary}
              </p>

              {/* Weather Consideration Banner */}
              {planResult.weatherConsideration && (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-coral-500/30 text-coral-300 shrink-0">
                    <CloudSun size={20} />
                  </div>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <span className="font-bold text-coral-300 block uppercase tracking-wider text-[11px]">
                      Weather Consideration
                    </span>
                    <p className="text-white/90 leading-relaxed font-medium">
                      {planResult.weatherConsideration}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Day-by-Day Itinerary Timeline */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-borderLine pb-3">
                <Calendar className="text-coral-500" size={22} />
                <h3 className="font-display font-bold text-xl text-primaryText">
                  Day-by-Day Itinerary
                </h3>
              </div>

              <div className="space-y-6">
                {planResult.days?.map((dayItem, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-borderLine p-5 sm:p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 border-b border-borderLine pb-3">
                      <div className="w-9 h-9 rounded-xl bg-coral-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        D{dayItem.day}
                      </div>
                      <h4 className="font-display font-bold text-base sm:text-lg text-primaryText">
                        {dayItem.title}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      {dayItem.activities?.map((act, aIdx) => {
                        const isMorning = act.time?.toLowerCase().includes("morning");
                        const isAfternoon = act.time?.toLowerCase().includes("afternoon");
                        return (
                          <div
                            key={aIdx}
                            className="bg-secondaryBg rounded-xl p-4 border border-borderLine/80 space-y-2"
                          >
                            <div className="flex items-center gap-1.5 text-xs font-bold text-coral-600 uppercase tracking-wider">
                              {isMorning ? (
                                <Sun size={14} />
                              ) : isAfternoon ? (
                                <Sunset size={14} />
                              ) : (
                                <Moon size={14} />
                              )}
                              <span>{act.time}</span>
                            </div>
                            <h5 className="font-semibold text-sm text-primaryText leading-snug">
                              {act.title}
                            </h5>
                            <p className="text-xs text-bodyText leading-relaxed">
                              {act.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Recommended Stays */}
            {planResult.recommendedHotels && planResult.recommendedHotels.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-borderLine pb-3">
                  <div className="flex items-center gap-2">
                    <HotelIcon className="text-coral-500" size={22} />
                    <h3 className="font-display font-bold text-xl text-primaryText">
                      Verified Recommended Stays
                    </h3>
                  </div>
                  <Badge variant="success" className="text-xs">
                    MongoDB Verified
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {planResult.recommendedHotels.map((hotel) => (
                    <div
                      key={hotel._id}
                      className="bg-white rounded-2xl border border-borderLine shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="relative h-48 w-full bg-gray-100">
                          <Image
                            src={
                              hotel.image ||
                              "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
                            }
                            alt={hotel.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-primaryText flex items-center gap-1 shadow-sm">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            {hotel.rating || 4.8}
                          </div>
                        </div>

                        <div className="p-5 space-y-3">
                          <div className="space-y-1">
                            <h4 className="font-display font-bold text-lg text-primaryText">
                              {hotel.name}
                            </h4>
                            <p className="text-xs text-coral-600 font-medium">
                              ₹{hotel.pricePerNight?.toLocaleString("en-IN")} / night
                            </p>
                          </div>

                          <p className="text-xs text-bodyText bg-coral-50/70 p-3 rounded-xl border border-coral-500/20 italic">
                            &ldquo;{hotel.aiReason}&rdquo;
                          </p>

                          {hotel.amenities && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {hotel.amenities.slice(0, 4).map((am, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-secondaryBg border border-borderLine px-2 py-0.5 rounded-md text-mutedText"
                                >
                                  {am}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-5 pt-0">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full justify-center"
                          onClick={() => setSelectedHotelForBooking(hotel)}
                        >
                          Book Hotel Stay
                          <ArrowRight size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Recommended Guides */}
            {planResult.recommendedGuides && planResult.recommendedGuides.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-borderLine pb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="text-coral-500" size={22} />
                    <h3 className="font-display font-bold text-xl text-primaryText">
                      Verified Local Guides
                    </h3>
                  </div>
                  <Badge variant="success" className="text-xs">
                    MongoDB Verified
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {planResult.recommendedGuides.map((guide) => (
                    <div
                      key={guide._id}
                      className="bg-white rounded-2xl border border-borderLine shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-borderLine">
                            <Image
                              src={
                                guide.profileImage ||
                                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80"
                              }
                              alt={guide.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-display font-bold text-lg text-primaryText">
                              {guide.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-mutedText">
                              <span className="flex items-center gap-1 text-amber-500 font-semibold">
                                <Star size={12} className="fill-amber-400" />
                                {guide.rating || 4.9}
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-primaryText">
                                ₹{guide.hourlyRate}/hr
                              </span>
                            </div>
                            <span className="text-[11px] text-coral-600 font-medium">
                              {guide.experienceYears || 3}+ years experience
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-bodyText bg-coral-50/70 p-3 rounded-xl border border-coral-500/20 italic">
                          &ldquo;{guide.aiReason}&rdquo;
                        </p>

                        {guide.languages && (
                          <div className="text-xs text-mutedText">
                            <span className="font-semibold text-primaryText">Languages: </span>
                            {guide.languages.join(", ")}
                          </div>
                        )}
                      </div>

                      <div className="pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center border-coral-500 text-coral-600 hover:bg-coral-50"
                          onClick={() => setSelectedGuideForBooking(guide)}
                        >
                          Book Local Guide
                          <ArrowRight size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Travel Tips */}
            {planResult.travelTips && planResult.travelTips.length > 0 && (
              <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <Lightbulb size={22} className="text-amber-600 shrink-0" />
                  <h3 className="font-display font-bold text-lg">
                    Local Travel Tips & Advice
                  </h3>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {planResult.travelTips.map((tip, idx) => (
                    <li
                      key={idx}
                      className="bg-white rounded-xl p-3.5 border border-amber-200/60 text-xs sm:text-sm text-primaryText flex items-start gap-2.5 shadow-sm"
                    >
                      <CheckCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}

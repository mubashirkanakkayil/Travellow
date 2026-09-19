"use client";

import React from "react";
import AIPlannerSection from "@/components/home/AIPlannerSection";
import { Sparkles, CheckCircle2, ShieldCheck, Compass } from "lucide-react";
import Badge from "@/components/ui/Badge";

export default function TripPlannerPage() {
  return (
    <div className="py-12 bg-white">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-primaryText to-gray-900 text-white rounded-3xl p-8 sm:p-12 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-coral-500/20 rounded-full blur-3xl pointer-events-none" />
          <Badge variant="coral">
            <Sparkles size={14} />
            Real Gemini 3.6 Flash AI Integration
          </Badge>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-tight">
            AI-Powered Smart Travel Planner
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-2xl leading-relaxed">
            Smart AI travel planning interface designed to curate personalized travel itineraries, handpicked accommodations, and local guide recommendations grounded in Travellow database context.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs text-white/90">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-coral-500" />
              <span>Grounded MongoDB Context</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-coral-500" />
              <span>Verified Hotel & Guide Recommendations</span>
            </div>
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-coral-500" />
              <span>Structured Day-by-Day Itineraries</span>
            </div>
          </div>
        </div>

        {/* Planner Interactive UI Section */}
        <AIPlannerSection />

      </div>
    </div>
  );
}

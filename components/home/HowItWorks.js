"use client";

import React from "react";
import { Compass, Sparkles, CalendarCheck, MapPin } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Discover Destinations",
    description: "Browse handpicked regions in India, Asia, and Europe or filter by budget, climate, and travel style.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Plan with AI",
    description: "Generate personalized day-by-day itineraries matched against verified stays and local guides.",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "Book Stays & Guides",
    description: "Reserve verified hotels and certified local tour guides with transparent, exact price calculations.",
    icon: CalendarCheck,
  },
  {
    number: "04",
    title: "Travel & Explore",
    description: "Enjoy stress-free exploration with live trip assistance, local insights, and weather updates.",
    icon: MapPin,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-coral-500 uppercase tracking-widest">
            Simple 4-Step Journey
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-primaryText tracking-tight">
            How Travellow Works
          </h2>
          <p className="text-bodyText text-sm sm:text-base">
            From smart AI trip generation to booking local guides, we make seamless travel planning effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="flex flex-col items-start p-6 rounded-2xl bg-secondaryBg border border-borderLine hover:border-coral-500/30 hover:shadow-lg transition-all duration-300 relative group"
              >
                <div className="flex items-center justify-between w-full mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-coral-100 text-coral-600 flex items-center justify-center group-hover:bg-coral-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                    <Icon size={22} />
                  </div>
                  <span className="font-display font-black text-3xl text-borderLine group-hover:text-coral-500/20 transition-colors">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-display font-bold text-xl text-primaryText mb-2 group-hover:text-coral-500 transition-colors">
                  {step.title}
                </h3>
                <p className="text-bodyText text-xs leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

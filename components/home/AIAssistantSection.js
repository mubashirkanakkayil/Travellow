"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bot, Sparkles, MessageSquare, ShieldCheck, Zap } from "lucide-react";
import Button from "@/components/ui/Button";

export default function AIAssistantSection() {
  return (
    <section className="py-20 bg-primaryText text-white relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-coral-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-coral-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-white">
              <Sparkles size={14} className="text-coral-500" />
              <span>Smart Travel Companion</span>
            </div>

            <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
              Meet Your 24/7 AI Travel Assistant
            </h2>

            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Have questions about local customs, climate conditions, or trip planning? Travellow AI provides smart, context-aware answers to guide your journey.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-coral-500 font-bold text-sm">
                  <ShieldCheck size={18} />
                  <span>Curated Insights</span>
                </div>
                <p className="text-xs text-white/70">Handpicked stay and tour guide recommendations.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-coral-500 font-bold text-sm">
                  <Zap size={18} />
                  <span>Instant Guidance</span>
                </div>
                <p className="text-xs text-white/70">Destination highlights & itinerary assistance.</p>
              </div>
            </div>

            <div className="pt-4">
              <Link href="/trip-planner">
                <Button variant="primary" size="lg" className="shadow-lg shadow-coral-500/30">
                  <MessageSquare size={18} />
                  Try AI Assistant Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Simulated AI Chat Box Preview */}
          <div className="lg:col-span-6 bg-white/5 border border-white/15 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-full bg-coral-500 flex items-center justify-center text-white">
                <Bot size={22} />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  Travellow AI
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h4>
                <p className="text-[11px] text-white/60">Smart Travel Assistant</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="space-y-3 py-2 text-xs">
              <div className="flex justify-end">
                <div className="bg-coral-500 text-white p-3 rounded-2xl rounded-tr-none max-w-[80%]">
                  What is the best time to visit Kerala backwaters and what stays do you recommend?
                </div>
              </div>

              <div className="flex justify-start items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-coral-500/30 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Sparkles size={14} className="text-coral-500" />
                </div>
                <div className="bg-white/10 border border-white/10 text-white/90 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] space-y-2 leading-relaxed">
                  <p>
                    The ideal time to visit Kerala backwaters is from <strong>September to March</strong> when the weather is pleasant and cool!
                  </p>
                  <p className="text-white/80">
                    Recommended stay: <strong>Kumarakom Lake Resort & Villas</strong> (₹18,000/night), rated 4.9★ by travelers.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                disabled
                placeholder="Ask Travellow AI anything..."
                className="w-full bg-white/10 border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs placeholder:text-white/40 focus:outline-none"
              />
              <Button variant="primary" size="sm" className="shrink-0">
                Send
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

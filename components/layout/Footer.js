"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Compass, Mail, Phone, MapPin, Globe, Heart } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Suppress public Footer on all Admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return (
    <footer className="bg-secondaryBg border-t border-borderLine pt-16 pb-12">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-borderLine">
          {/* Brand & Summary */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-coral-500/20 shrink-0 border border-coral-200 bg-white">
                <Image
                  src="/logo.png"
                  alt="Travellow Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl text-primaryText tracking-tight">
                  Travellow
                </span>
                <span className="text-[10px] font-medium text-coral-500 uppercase tracking-widest -mt-1">
                  AI Travel Platform
                </span>
              </div>
            </Link>
            <p className="text-bodyText text-sm leading-relaxed max-w-sm">
              Your AI-powered travel companion for discovering handpicked destinations, luxury stays, verified local tour guides, and personalized trip itineraries.
            </p>
            <div className="flex items-center gap-3 text-mutedText pt-2">
              <span className="text-xs font-medium uppercase tracking-wider text-primaryText">Regions Covered:</span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-white border border-borderLine text-bodyText">India</span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-white border border-borderLine text-bodyText">Asia</span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-white border border-borderLine text-bodyText">Europe</span>
            </div>
          </div>

          {/* Nav Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display font-semibold text-primaryText text-sm tracking-wide uppercase">
              Platform
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-bodyText">
              <li>
                <Link href="/" className="hover:text-coral-500 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/destinations" className="hover:text-coral-500 transition-colors">Destinations</Link>
              </li>
              <li>
                <Link href="/hotels" className="hover:text-coral-500 transition-colors">Hotels & Stays</Link>
              </li>
              <li>
                <Link href="/guides" className="hover:text-coral-500 transition-colors">Local Guides</Link>
              </li>
              <li>
                <Link href="/trip-planner" className="hover:text-coral-500 transition-colors">AI Trip Planner</Link>
              </li>
            </ul>
          </div>

          {/* Destinations */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display font-semibold text-primaryText text-sm tracking-wide uppercase">
              Popular Regions
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-bodyText">
              <li><Link href="/destinations?region=India" className="hover:text-coral-500 transition-colors">Kerala & Goa (India)</Link></li>
              <li><Link href="/destinations?region=Asia" className="hover:text-coral-500 transition-colors">Bali (Indonesia)</Link></li>
              <li><Link href="/destinations?region=Asia" className="hover:text-coral-500 transition-colors">Thailand & Japan</Link></li>
              <li><Link href="/destinations?region=Europe" className="hover:text-coral-500 transition-colors">Switzerland & Italy</Link></li>
              <li><Link href="/destinations?region=Europe" className="hover:text-coral-500 transition-colors">Greece & France</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display font-semibold text-primaryText text-sm tracking-wide uppercase">
              Contact & Info
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-bodyText">
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-coral-500 shrink-0" />
                <span>MCA Mini Project 2026</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-coral-500 shrink-0" />
                <span>support@travellow.ai</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe size={16} className="text-coral-500 shrink-0" />
                <span>Multi-currency Ready (INR, USD, AED, EUR, GBP, JPY)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-mutedText">
          <p>© 2026 Travellow. Built for MCA Project presentation.</p>
          <div className="flex items-center gap-1">
            <span>Designed with</span>
            <Heart size={14} className="text-coral-500 fill-coral-500" />
            <span>for seamless AI travel planning</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

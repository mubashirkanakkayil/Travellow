"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Star, Bookmark, ChevronLeft, ChevronRight, Sparkles, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";

// Hero slides inspired by reference video destinations
const heroSlides = [
  {
    id: "indonesia",
    title: "INDONESIA",
    subtitle: "Explore magnificent volcanic landscapes, ancient temples, rich cultural heritage, and tropical paradise beaches across over 17,000 islands.",
    watermark: "Indonesia",
    country: "Southeast Asia",
    region: "Asia",
    rating: 4.9,
    reviews: 320,
    price: 49000,
    mainImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80",
    previewTitle: "Buddha Temple, Indonesia",
  },
  {
    id: "thailand",
    title: "THAILAND",
    subtitle: "Experience ornate golden shrines, bustling street food culture, emerald islands, and warm hospitality in the land of smiles.",
    watermark: "Thailand",
    country: "Southeast Asia",
    region: "Asia",
    rating: 4.8,
    reviews: 280,
    price: 42000,
    mainImage: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=80",
    previewTitle: "Grand Palace, Thailand",
  },
  {
    id: "bali",
    title: "BALI",
    subtitle: "Immerse yourself in serene rice terraces, iconic cliffside beaches, sacred water temples, and world-class luxury wellness retreats.",
    watermark: "Bali",
    country: "Indonesia",
    region: "Asia",
    rating: 4.9,
    reviews: 410,
    price: 55000,
    mainImage: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1600&q=80",
    previewTitle: "Broken Beach, Bali",
  },
  {
    id: "kerala",
    title: "KERALA",
    subtitle: "Discover God's Own Country with tranquil emerald backwaters, mist-clad tea plantations in Munnar, and heritage spice gardens.",
    watermark: "Kerala",
    country: "India",
    region: "India",
    rating: 4.9,
    reviews: 350,
    price: 38000,
    mainImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80",
    previewTitle: "Munnar Tea Hills, Kerala",
  },
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const currentSlide = heroSlides[currentIndex];

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  return (
    <section className="relative w-full bg-primaryText text-white min-h-[640px] lg:min-h-[720px] overflow-hidden flex items-center">
      {/* Background Image with Dynamic Fade Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={currentSlide.mainImage}
            alt={currentSlide.title}
            fill
            priority
            className="object-cover object-center"
          />
          {/* Dark Overlay Gradient inspired by video */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/40" />
        </motion.div>
      </AnimatePresence>

      {/* Background Watermark Text (Inspired by Reference Video) */}
      <div className="absolute bottom-6 left-12 pointer-events-none select-none overflow-hidden opacity-15 hidden md:block">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentSlide.watermark}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 0.2, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
            className="font-display font-black text-[120px] lg:text-[180px] tracking-widest text-white/30 uppercase leading-none block"
          >
            {currentSlide.watermark}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="relative max-w-container mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero Content Section */}
          <div className="lg:col-span-7 flex items-start gap-6 sm:gap-8">
            {/* Vertical Timeline / Pagination Bar (Inspired by Video) */}
            <div className="hidden sm:flex flex-col items-center gap-4 py-2 shrink-0">
              <span className="text-xs font-mono text-coral-500 font-bold">
                0{currentIndex + 1}
              </span>
              <div className="w-[2px] h-24 bg-white/20 relative overflow-hidden rounded-full">
                <motion.div
                  className="w-full bg-coral-500 rounded-full"
                  animate={{
                    height: `${((currentIndex + 1) / heroSlides.length) * 100}%`,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-xs font-mono text-white/40">
                0{heroSlides.length}
              </span>
            </div>

            {/* Title, Badge & Copy */}
            <div className="flex flex-col items-start gap-4">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-medium text-white shadow-sm"
              >
                <Sparkles size={14} className="text-coral-500" />
                <span>Smart Travel Discovery</span>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-3"
                >
                  <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl text-white tracking-tight uppercase">
                    {currentSlide.title}
                  </h1>
                  <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-xl">
                    {currentSlide.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/destinations">
                  <Button variant="primary" size="lg" className="shadow-lg shadow-coral-500/30">
                    Explore Destination
                    <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link href="/trip-planner">
                  <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:border-white">
                    Plan with AI
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Destination Preview Stack / Carousel (Video Reference Inspired) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-white/60 font-medium">
                Upcoming Destinations
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-colors"
                  aria-label="Previous destination"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNext}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-colors"
                  aria-label="Next destination"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Destination Preview Cards Carousel Stack */}
            <div className="grid grid-cols-2 gap-4">
              {heroSlides.map((slide, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <motion.div
                    key={slide.id}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentIndex(idx);
                    }}
                    whileHover={{ scale: 1.02 }}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer h-44 sm:h-48 border transition-all duration-300 ${
                      isActive
                        ? "border-coral-500 ring-2 ring-coral-500/50 shadow-xl"
                        : "border-white/20 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={slide.mainImage}
                      alt={slide.title}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    <div className="absolute top-2.5 right-2.5">
                      <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                        <Bookmark size={13} />
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold">
                        <Star size={11} className="fill-amber-400" />
                        <span>{slide.rating}</span>
                      </div>
                      <span className="text-xs font-bold text-white line-clamp-1 font-display">
                        {slide.previewTitle}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, ArrowRight, Bookmark } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function DestinationCard({ destination }) {
  const {
    id,
    _id,
    name,
    country,
    region,
    description,
    shortDescription,
    image,
    imageUrl,
    rating = 4.8,
    reviewCount,
    reviewsCount,
    startingPrice = 35000,
  } = destination;

  const displayImage = image || imageUrl || "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80";
  const displayReviewCount = reviewCount ?? reviewsCount ?? 120;
  const displayDesc = shortDescription || description;

  return (
    <Card className="group flex flex-col h-full bg-white">
      {/* Image Container */}
      <div className="relative w-full h-60 overflow-hidden bg-secondaryBg">
        <Image
          src={displayImage}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="dark">{region}</Badge>
        </div>
        <button
          aria-label="Save destination"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 hover:bg-white backdrop-blur-md flex items-center justify-center text-primaryText transition-colors shadow-sm"
        >
          <Bookmark size={18} className="hover:text-coral-500" />
        </button>

        <div className="absolute bottom-3 right-3">
          <Badge variant="light" className="font-semibold text-xs">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {rating} <span className="text-mutedText">({displayReviewCount})</span>
          </Badge>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-grow justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-coral-600 font-medium">
            <MapPin size={14} />
            <span>{country}</span>
          </div>
          <h3 className="font-display font-bold text-xl text-primaryText group-hover:text-coral-500 transition-colors">
            {name}
          </h3>
          <p className="text-bodyText text-xs leading-relaxed line-clamp-2">
            {displayDesc}
          </p>
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-borderLine flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-mutedText tracking-wider font-semibold">Starting from</span>
            <span className="font-display font-bold text-lg text-primaryText">
              ₹{startingPrice.toLocaleString("en-IN")} <span className="text-xs font-normal text-mutedText">/ person</span>
            </span>
          </div>
          <Link href={`/destinations/${destination.slug || _id || id}`}>
            <Button variant="softCoral" size="sm">
              Explore
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

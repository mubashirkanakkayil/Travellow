"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({
  rating = 0,
  maxStars = 5,
  size = 18,
  interactive = false,
  onRatingChange = () => {},
  className = "",
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxStars }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayRating;

        if (interactive) {
          return (
            <button
              key={index}
              type="button"
              onClick={() => onRatingChange(starValue)}
              onMouseEnter={() => setHoverRating(starValue)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`Rate ${starValue} out of ${maxStars} stars`}
              className="p-0.5 focus:outline-none focus:scale-110 transition-transform cursor-pointer"
            >
              <Star
                size={size}
                className={
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-slate-100 text-slate-300 hover:text-amber-300 hover:fill-amber-100"
                }
              />
            </button>
          );
        }

        return (
          <Star
            key={index}
            size={size}
            className={
              isFilled
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-100 text-slate-300"
            }
          />
        );
      })}
    </div>
  );
}

"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export default function Card({ children, className = "", hover = true, ...props }) {
  return (
    <div
      className={cn(
        "bg-white border border-borderLine rounded-2xl overflow-hidden transition-all duration-300",
        hover && "hover:border-coral-500/30 hover:shadow-lg hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

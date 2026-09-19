"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export default function Badge({
  children,
  variant = "coral",
  className = "",
  ...props
}) {
  const variants = {
    coral: "bg-coral-100 text-coral-600 border border-coral-500/20",
    dark: "bg-primaryText/90 text-white backdrop-blur-md",
    light: "bg-white/90 text-primaryText border border-borderLine backdrop-blur-md shadow-sm",
    secondary: "bg-secondaryBg text-bodyText border border-borderLine",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

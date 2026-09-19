"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button",
  disabled = false,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-full cursor-pointer";

  const variants = {
    primary:
      "bg-coral-500 text-white hover:bg-coral-600 shadow-sm hover:shadow-md active:scale-[0.98]",
    secondary:
      "bg-secondaryBg text-primaryText border border-borderLine hover:bg-white hover:border-coral-500 hover:text-coral-500 active:scale-[0.98]",
    outline:
      "bg-transparent text-primaryText border border-borderLine hover:border-coral-500 hover:text-coral-500 active:scale-[0.98]",
    ghost:
      "bg-transparent text-bodyText hover:text-primaryText hover:bg-secondaryBg",
    softCoral:
      "bg-coral-100 text-coral-600 hover:bg-coral-500 hover:text-white transition-colors",
  };

  const sizes = {
    sm: "text-xs px-4 py-2 gap-1.5",
    md: "text-sm px-5 py-2.5 gap-2",
    lg: "text-base px-7 py-3.5 gap-2.5 font-semibold",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

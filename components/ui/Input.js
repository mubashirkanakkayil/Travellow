"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export default function Input({
  label,
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  className = "",
  error,
  ...props
}) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-bodyText">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-mutedText pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "w-full bg-secondaryBg border border-borderLine text-primaryText rounded-xl py-2.5 text-sm transition-all focus:outline-none focus:border-coral-500 focus:bg-white placeholder:text-mutedText",
            Icon ? "pl-10 pr-4" : "px-4",
            error && "border-red-500",
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
    </div>
  );
}

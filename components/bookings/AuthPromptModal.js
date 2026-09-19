"use client";

import React from "react";
import Link from "next/link";
import { X, LogIn, Lock, Compass } from "lucide-react";
import Button from "@/components/ui/Button";

export default function AuthPromptModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-borderLine shadow-xl p-6 sm:p-8 space-y-6 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-mutedText hover:text-primaryText hover:bg-secondaryBg transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-coral-100 text-coral-500 mx-auto flex items-center justify-center">
          <Lock size={26} />
        </div>

        {/* Text Header */}
        <div className="space-y-2">
          <h3 className="font-display font-extrabold text-2xl text-primaryText">
            Sign in to book
          </h3>
          <p className="text-sm text-bodyText leading-relaxed">
            Please sign in to your Travellow account before making a reservation or booking a guide.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link href="/sign-in" className="w-full">
            <Button variant="primary" size="md" className="w-full justify-center">
              <LogIn size={16} />
              Sign In
            </Button>
          </Link>
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            className="w-full justify-center"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

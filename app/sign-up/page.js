"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Phone,
  Globe,
  DollarSign,
  UserPlus,
  Loader2,
  AlertCircle,
  Compass,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const CURRENCY_OPTIONS = [
  { code: "INR", label: "INR (₹) - Indian Rupee" },
  { code: "USD", label: "USD ($) - US Dollar" },
  { code: "AED", label: "AED (AED) - UAE Dirham" },
  { code: "EUR", label: "EUR (€) - Euro" },
  { code: "GBP", label: "GBP (£) - British Pound" },
  { code: "JPY", label: "JPY (¥) - Japanese Yen" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState("traveler"); // "traveler" | "guide"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    country: "India",
    preferredCurrency: "INR",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        // Registered User role is ALWAYS initial "USER"
        // If "guide" was selected, redirect to guide application page
        if (accountType === "guide") {
          router.push("/guide/apply");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="w-full max-w-lg space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-borderLine shadow-sm">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden shadow-md border border-coral-200 bg-white mb-1">
            <Image
              src="/logo.png"
              alt="Travellow Logo"
              width={56}
              height={56}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          <h2 className="font-display font-extrabold text-3xl text-primaryText tracking-tight">
            Create Your Travellow Account
          </h2>
          <p className="text-sm text-bodyText">
            Join Travellow to explore handpicked destinations and plan AI itineraries.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-600 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Account Type Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-primaryText block">
            Choose Account Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccountType("traveler")}
              className={`p-4 rounded-2xl border text-left transition-all ${
                accountType === "traveler"
                  ? "border-coral-500 bg-coral-50/50 ring-2 ring-coral-500/20"
                  : "border-borderLine bg-white hover:bg-gray-50"
              }`}
            >
              <span className="font-bold text-sm text-primaryText block">Traveler</span>
              <span className="text-xs text-mutedText block mt-0.5">
                Plan trips and book travel services
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAccountType("guide")}
              className={`p-4 rounded-2xl border text-left transition-all ${
                accountType === "guide"
                  ? "border-coral-500 bg-coral-50/50 ring-2 ring-coral-500/20"
                  : "border-borderLine bg-white hover:bg-gray-50"
              }`}
            >
              <span className="font-bold text-sm text-primaryText block">Become a Guide</span>
              <span className="text-xs text-mutedText block mt-0.5">
                Apply to become a local Travellow guide
              </span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            icon={User}
            placeholder="Anney Tester"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            icon={Mail}
            placeholder="anney@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            icon={Lock}
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              icon={Phone}
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={handleChange}
            />

            <Input
              label="Country"
              name="country"
              icon={Globe}
              placeholder="India"
              value={formData.country}
              onChange={handleChange}
            />
          </div>

          {/* Preferred Currency Select */}
          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-bodyText flex items-center gap-1">
              <DollarSign size={14} className="text-mutedText" />
              Preferred Currency
            </label>
            <select
              name="preferredCurrency"
              value={formData.preferredCurrency}
              onChange={handleChange}
              className="w-full bg-secondaryBg border border-borderLine text-primaryText rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-coral-500 focus:bg-white"
            >
              {CURRENCY_OPTIONS.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center mt-4"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </Button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-borderLine">
          <p className="text-sm text-bodyText">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-semibold text-coral-500 hover:text-coral-600 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

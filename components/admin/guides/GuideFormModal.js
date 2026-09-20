"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Users,
  UserCheck,
  MapPin,
  DollarSign,
  Briefcase,
  Languages,
  Award,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import Button from "@/components/ui/Button";

const CURRENCIES = ["INR", "USD", "AED", "EUR", "GBP", "JPY"];

export default function GuideFormModal({
  isOpen,
  onClose,
  guideToEdit = null,
  onSuccess,
}) {
  const isEdit = Boolean(guideToEdit);

  // Available destinations list fetched from MongoDB
  const [destinations, setDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    destination: "",
    country: "",
    bio: "",
    profileImage: "",
    languagesText: "",
    specialtiesText: "",
    hourlyRate: "",
    currency: "INR",
    experienceYears: "3",
    verified: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Image load error handling for preview
  const [imageLoadError, setImageLoadError] = useState(false);

  // Fetch available destinations from API
  useEffect(() => {
    if (!isOpen) return;

    const fetchDestinations = async () => {
      try {
        setLoadingDestinations(true);
        const res = await fetch("/api/admin/destinations?limit=100");
        const data = await res.json();
        if (res.ok && data.success) {
          setDestinations(data.destinations || []);
        }
      } catch (err) {
        console.error("Error fetching destinations for guide modal:", err);
      } finally {
        setLoadingDestinations(false);
      }
    };

    fetchDestinations();
  }, [isOpen]);

  // Populate form fields on edit or reset on create
  useEffect(() => {
    if (!isOpen) return;

    if (guideToEdit) {
      const destId =
        typeof guideToEdit.destination === "object"
          ? guideToEdit.destination?._id
          : guideToEdit.destination;

      setFormData({
        name: guideToEdit.name || "",
        destination: destId || "",
        country: guideToEdit.country || "",
        bio: guideToEdit.bio || "",
        profileImage: guideToEdit.profileImage || "",
        languagesText: Array.isArray(guideToEdit.languages)
          ? guideToEdit.languages.join("\n")
          : "English",
        specialtiesText: Array.isArray(guideToEdit.specialties)
          ? guideToEdit.specialties.join("\n")
          : "",
        hourlyRate: guideToEdit.hourlyRate !== undefined ? String(guideToEdit.hourlyRate) : "",
        currency: guideToEdit.currency || "INR",
        experienceYears: guideToEdit.experienceYears !== undefined ? String(guideToEdit.experienceYears) : "3",
        verified: guideToEdit.verified !== undefined ? Boolean(guideToEdit.verified) : true,
      });
    } else {
      setFormData({
        name: "",
        destination: "",
        country: "",
        bio: "",
        profileImage: "",
        languagesText: "English\nHindi\nMalayalam",
        specialtiesText: "Cultural & Heritage Tours\nFood & Culinary Exploration\nPhotography",
        hourlyRate: "1500",
        currency: "INR",
        experienceYears: "5",
        verified: true,
      });
    }

    setImageLoadError(false);
    setFormError(null);
  }, [isOpen, guideToEdit]);

  // Handle Destination select change & auto-populate country
  const handleDestinationChange = (e) => {
    const selectedId = e.target.value;
    const foundDest = destinations.find((d) => d._id === selectedId);

    setFormData((prev) => ({
      ...prev,
      destination: selectedId,
      country: foundDest ? foundDest.country : prev.country,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "profileImage") setImageLoadError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validations
    if (!formData.name.trim()) {
      setFormError("Guide name is required.");
      return;
    }
    if (!formData.destination) {
      setFormError("Please select a destination from the list.");
      return;
    }
    if (!formData.country.trim()) {
      setFormError("Country is required.");
      return;
    }
    if (!formData.bio.trim()) {
      setFormError("Guide bio is required.");
      return;
    }
    if (!formData.profileImage.trim()) {
      setFormError("Profile image URL is required.");
      return;
    }

    const rateNum = parseFloat(formData.hourlyRate);
    if (isNaN(rateNum) || rateNum < 0) {
      setFormError("Hourly rate must be a valid number greater than or equal to 0.");
      return;
    }

    const expNum = parseInt(formData.experienceYears, 10);
    if (isNaN(expNum) || expNum < 0) {
      setFormError("Experience years must be a valid number greater than or equal to 0.");
      return;
    }

    // Format languages & specialties arrays
    const languagesArray = formData.languagesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const specialtiesArray = formData.specialtiesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name.trim(),
      destination: formData.destination,
      country: formData.country.trim(),
      bio: formData.bio.trim(),
      profileImage: formData.profileImage.trim(),
      languages: languagesArray.length > 0 ? languagesArray : ["English"],
      specialties: specialtiesArray,
      hourlyRate: rateNum,
      currency: formData.currency,
      experienceYears: expNum,
      verified: formData.verified,
    };

    try {
      setSubmitting(true);

      const url = isEdit
        ? `/api/admin/guides/${guideToEdit._id}`
        : "/api/admin/guides";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess(data.guide);
        onClose();
      } else {
        setFormError(data.error || "Failed to save guide.");
      }
    } catch (err) {
      console.error("Guide submit error:", err);
      setFormError("Network error while submitting guide details.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-borderLine shadow-2xl w-full max-w-3xl my-8 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-borderLine flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-bold shadow-md">
              <Users size={22} />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white">
                {isEdit ? "Edit Guide Profile" : "Add New Local Guide"}
              </h2>
              <p className="text-xs text-slate-400">
                {isEdit
                  ? `Updating guide record for "${guideToEdit?.name}"`
                  : "Register a verified local expert in MongoDB Atlas"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ERROR ALERT BANNER */}
          {formError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* RATING PROTECTION NOTICE */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
            <Info size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Rating & Reviews Protection:</strong> Star rating and review count are strictly updated by user reviews and cannot be edited manually.
            </span>
          </div>

          {/* SECTION 1: BASIC INFORMATION */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-coral-500 border-b border-borderLine pb-2 flex items-center gap-1.5">
              <UserCheck size={14} /> Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Guide Name */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-primaryText">
                  Full Name <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Arjun Menon"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                  required
                />
              </div>

              {/* Destination Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-primaryText flex items-center justify-between">
                  <span>Destination <span className="text-coral-500">*</span></span>
                  {loadingDestinations && (
                    <span className="text-[10px] text-mutedText flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> Loading...
                    </span>
                  )}
                </label>
                <select
                  name="destination"
                  value={formData.destination}
                  onChange={handleDestinationChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                  required
                >
                  <option value="">-- Select Destination --</option>
                  {destinations.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} — {d.country} ({d.region})
                    </option>
                  ))}
                </select>
              </div>

              {/* Country */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-primaryText">
                  Country <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g. India"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                  required
                />
              </div>

              {/* Guide Bio */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-primaryText">
                  Bio / Overview <span className="text-coral-500">*</span>
                </label>
                <textarea
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Passionate local guide specializing in heritage walks, backwaters, and local cuisine..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                  required
                />
              </div>

            </div>
          </div>

          {/* SECTION 2: PROFILE PHOTO & PREVIEW */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-coral-500 border-b border-borderLine pb-2 flex items-center gap-1.5">
              <ImageIcon size={14} /> Profile Photo
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-primaryText">
                  Profile Image URL <span className="text-coral-500">*</span>
                </label>
                <input
                  type="url"
                  name="profileImage"
                  value={formData.profileImage}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                  required
                />
              </div>

              {/* Profile Image Preview */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-primaryText block">Photo Preview</label>
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-borderLine flex items-center justify-center text-center mx-auto sm:mx-0">
                  {formData.profileImage && !imageLoadError ? (
                    <Image
                      src={formData.profileImage}
                      alt="Guide preview"
                      fill
                      className="object-cover"
                      onError={() => setImageLoadError(true)}
                    />
                  ) : (
                    <div className="space-y-1 text-mutedText">
                      <ImageIcon size={20} className="mx-auto text-slate-300" />
                      <span className="text-[9px] block font-medium">
                        {imageLoadError ? "Invalid URL" : "No Photo"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 3: LANGUAGES & SPECIALTIES */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-coral-500 border-b border-borderLine pb-2 flex items-center gap-1.5">
              <Languages size={14} /> Languages & Tour Specialties
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Languages */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-primaryText flex items-center justify-between">
                  <span>Languages Spoken</span>
                  <span className="text-[10px] text-mutedText">(One per line)</span>
                </label>
                <textarea
                  name="languagesText"
                  rows={3}
                  value={formData.languagesText}
                  onChange={handleChange}
                  placeholder="English&#10;Hindi&#10;Malayalam&#10;German"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                />
              </div>

              {/* Specialties */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-primaryText flex items-center justify-between">
                  <span>Specialties & Skills</span>
                  <span className="text-[10px] text-mutedText">(One per line)</span>
                </label>
                <textarea
                  name="specialtiesText"
                  rows={3}
                  value={formData.specialtiesText}
                  onChange={handleChange}
                  placeholder="Cultural Heritage Tours&#10;Food & Spice Exploration&#10;Backwater Boat Tours"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                />
              </div>

            </div>
          </div>

          {/* SECTION 4: PRICING, EXPERIENCE & VERIFICATION */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-coral-500 border-b border-borderLine pb-2 flex items-center gap-1.5">
              <DollarSign size={14} /> Pricing, Experience & Verification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              
              {/* Hourly Rate */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-primaryText">
                  Hourly Rate <span className="text-coral-500">*</span>
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  min="0"
                  step="any"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  placeholder="e.g. 1500"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-bold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                  required
                />
              </div>

              {/* Currency */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-primaryText">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-bold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Experience Years */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-primaryText">
                  Experience (Years) <span className="text-coral-500">*</span>
                </label>
                <input
                  type="number"
                  name="experienceYears"
                  min="0"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-bold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                  required
                />
              </div>

              {/* Verified Checkbox Toggle */}
              <div className="p-3.5 rounded-2xl bg-secondaryBg border border-borderLine flex items-center justify-between sm:col-span-3">
                <div>
                  <span className="text-xs font-bold text-primaryText flex items-center gap-1.5">
                    <Award size={15} className="text-teal-600" /> Verified Local Guide Status
                  </span>
                  <span className="text-[10px] text-mutedText block">
                    Displays a verified badge on public guide listings and search results
                  </span>
                </div>
                <input
                  type="checkbox"
                  name="verified"
                  checked={formData.verified}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-coral-500 focus:ring-coral-500"
                />
              </div>

            </div>
          </div>

        </form>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-borderLine bg-secondaryBg flex items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={submitting}
            onClick={handleSubmit}
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Guide...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{isEdit ? "Update Guide" : "Create Guide"}</span>
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}

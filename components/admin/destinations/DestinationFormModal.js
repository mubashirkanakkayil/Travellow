"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, MapPin, DollarSign, Image as ImageIcon, Loader2, AlertCircle, Wand2 } from "lucide-react";
import Button from "@/components/ui/Button";

function normalizeSlug(rawSlug) {
  if (!rawSlug || typeof rawSlug !== "string") return "";
  return rawSlug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function DestinationFormModal({
  isOpen,
  onClose,
  destinationToEdit = null,
  onSuccess = () => {},
}) {
  const isEditing = Boolean(destinationToEdit);

  const [formData, setFormData] = useState({
    name: "",
    country: "",
    region: "INDIA",
    slug: "",
    description: "",
    shortDescription: "",
    image: "",
    galleryText: "",
    startingPrice: 25000,
    currency: "INR",
    bestTimeToVisit: "",
    activitiesText: "",
    highlightsText: "",
    latitude: 0,
    longitude: 0,
    featured: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Populate form when editing or resetting
  useEffect(() => {
    if (destinationToEdit) {
      setFormData({
        name: destinationToEdit.name || "",
        country: destinationToEdit.country || "",
        region: destinationToEdit.region || "INDIA",
        slug: destinationToEdit.slug || "",
        description: destinationToEdit.description || "",
        shortDescription: destinationToEdit.shortDescription || "",
        image: destinationToEdit.image || "",
        galleryText: Array.isArray(destinationToEdit.gallery)
          ? destinationToEdit.gallery.join("\n")
          : "",
        startingPrice: destinationToEdit.startingPrice ?? 25000,
        currency: destinationToEdit.currency || "INR",
        bestTimeToVisit: destinationToEdit.bestTimeToVisit || "",
        activitiesText: Array.isArray(destinationToEdit.activities)
          ? destinationToEdit.activities.join("\n")
          : "",
        highlightsText: Array.isArray(destinationToEdit.highlights)
          ? destinationToEdit.highlights.join("\n")
          : "",
        latitude: destinationToEdit.latitude ?? 0,
        longitude: destinationToEdit.longitude ?? 0,
        featured: Boolean(destinationToEdit.featured),
      });
    } else {
      setFormData({
        name: "",
        country: "",
        region: "INDIA",
        slug: "",
        description: "",
        shortDescription: "",
        image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
        galleryText: "",
        startingPrice: 25000,
        currency: "INR",
        bestTimeToVisit: "October to March",
        activitiesText: "Sightseeing\nLocal Culture\nPhotography",
        highlightsText: "Scenic Landscapes\nHistorical Monuments\nLocal Cuisine",
        latitude: 20.5937,
        longitude: 78.9629,
        featured: false,
      });
    }
    setError(null);
  }, [destinationToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAutoSlug = () => {
    if (formData.name) {
      setFormData((prev) => ({
        ...prev,
        slug: normalizeSlug(prev.name),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Parse textareas into arrays (split by line breaks)
    const galleryArray = formData.galleryText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const activitiesArray = formData.activitiesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const highlightsArray = formData.highlightsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name,
      country: formData.country,
      region: formData.region,
      slug: formData.slug || normalizeSlug(formData.name),
      description: formData.description,
      shortDescription: formData.shortDescription,
      image: formData.image,
      gallery: galleryArray,
      startingPrice: Number(formData.startingPrice),
      currency: formData.currency,
      bestTimeToVisit: formData.bestTimeToVisit,
      activities: activitiesArray,
      highlights: highlightsArray,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      featured: formData.featured,
    };

    try {
      setSubmitting(true);

      const url = isEditing
        ? `/api/admin/destinations/${destinationToEdit._id}`
        : "/api/admin/destinations";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess(data.destination);
        onClose();
      } else {
        setError(data.error || "Failed to save destination.");
      }
    } catch (err) {
      console.error("Destination save error:", err);
      setError("An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-borderLine shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-borderLine flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-coral-500 text-white">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                {isEditing ? `Edit Destination: ${destinationToEdit.name}` : "Add New Destination"}
              </h3>
              <p className="text-xs text-slate-300">
                {isEditing ? "Update destination records in MongoDB Atlas" : "Create a new destination catalog item"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL FORM BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* BASIC INFORMATION GRID */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm text-primaryText uppercase tracking-wider border-b border-borderLine pb-2">
              1. Basic Identification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-primaryText block mb-1">
                  Destination Name <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Goa, Kyoto, Swiss Alps"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-primaryText block mb-1">
                  Country <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g. India, Japan, Switzerland"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-primaryText block mb-1">
                  Region <span className="text-coral-500">*</span>
                </label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                >
                  <option value="INDIA">India</option>
                  <option value="ASIA">Asia</option>
                  <option value="EUROPE">Europe</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-primaryText block">
                    URL Slug <span className="text-coral-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSlug}
                    className="text-[11px] font-semibold text-coral-600 hover:text-coral-700 flex items-center gap-1"
                  >
                    <Wand2 size={12} /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="e.g. goa, kyoto, swiss-alps"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50 font-mono"
                />
              </div>
            </div>
          </div>

          {/* CONTENT DESCRIPTIONS */}
          <div className="space-y-4 pt-2">
            <h4 className="font-display font-bold text-sm text-primaryText uppercase tracking-wider border-b border-borderLine pb-2">
              2. Content & Overview
            </h4>

            <div>
              <label className="text-xs font-bold text-primaryText block mb-1">
                Short Description <span className="text-coral-500">*</span>
              </label>
              <input
                type="text"
                name="shortDescription"
                required
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="A quick 1-2 sentence preview summary..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-primaryText block mb-1">
                Full Description <span className="text-coral-500">*</span>
              </label>
              <textarea
                rows={4}
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Comprehensive travel details about the destination..."
                className="w-full p-3.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-primaryText block mb-1">
                Best Time to Visit
              </label>
              <input
                type="text"
                name="bestTimeToVisit"
                value={formData.bestTimeToVisit}
                onChange={handleChange}
                placeholder="e.g. November to February"
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
              />
            </div>
          </div>

          {/* MEDIA & IMAGES */}
          <div className="space-y-4 pt-2">
            <h4 className="font-display font-bold text-sm text-primaryText uppercase tracking-wider border-b border-borderLine pb-2">
              3. Media URLs
            </h4>

            <div>
              <label className="text-xs font-bold text-primaryText block mb-1">
                Main Image URL <span className="text-coral-500">*</span>
              </label>
              <input
                type="url"
                name="image"
                required
                value={formData.image}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-primaryText block mb-1">
                Gallery Image URLs (1 URL per line)
              </label>
              <textarea
                rows={3}
                name="galleryText"
                value={formData.galleryText}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/photo-1&#10;https://images.unsplash.com/photo-2"
                className="w-full p-3.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-mono text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
              />
            </div>
          </div>

          {/* PRICING & COORDINATES */}
          <div className="space-y-4 pt-2">
            <h4 className="font-display font-bold text-sm text-primaryText uppercase tracking-wider border-b border-borderLine pb-2">
              4. Pricing & Map Coordinates
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-primaryText block mb-1">
                  Starting Price <span className="text-coral-500">*</span>
                </label>
                <input
                  type="number"
                  name="startingPrice"
                  required
                  min="0"
                  value={formData.startingPrice}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-primaryText block mb-1">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="AED">AED (AED)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-primaryText block mb-1">
                  Latitude (-90 to 90) <span className="text-coral-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  required
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g. 15.2993"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-primaryText block mb-1">
                  Longitude (-180 to 180) <span className="text-coral-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  required
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g. 74.1240"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                />
              </div>
            </div>
          </div>

          {/* ARRAYS & TOGGLES */}
          <div className="space-y-4 pt-2">
            <h4 className="font-display font-bold text-sm text-primaryText uppercase tracking-wider border-b border-borderLine pb-2">
              5. Highlights, Activities & Status
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-primaryText block mb-1">
                  Activities (1 per line)
                </label>
                <textarea
                  rows={3}
                  name="activitiesText"
                  value={formData.activitiesText}
                  onChange={handleChange}
                  placeholder="Water Sports&#10;Scuba Diving&#10;Nightlife"
                  className="w-full p-3.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-primaryText block mb-1">
                  Highlights (1 per line)
                </label>
                <textarea
                  rows={3}
                  name="highlightsText"
                  value={formData.highlightsText}
                  onChange={handleChange}
                  placeholder="Baga Beach&#10;Fort Aguada&#10;Dudhsagar Falls"
                  className="w-full p-3.5 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-coral-500 focus:ring-coral-500 border-borderLine"
                />
                <span className="text-xs font-bold text-primaryText">
                  Featured Destination (Highlight on Homepage)
                </span>
              </label>
            </div>
          </div>

          {/* FORM FOOTER */}
          <div className="pt-4 border-t border-borderLine flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting} className="gap-2">
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>{isEditing ? "Save Changes" : "Create Destination"}</span>
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}

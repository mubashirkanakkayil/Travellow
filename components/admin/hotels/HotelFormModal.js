"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Hotel,
  MapPin,
  DollarSign,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  Building2,
  Compass,
} from "lucide-react";
import Button from "@/components/ui/Button";

const CURRENCIES = ["INR", "USD", "AED", "EUR", "GBP", "JPY"];

export default function HotelFormModal({
  isOpen,
  onClose,
  hotelToEdit = null,
  onSuccess,
}) {
  const isEdit = Boolean(hotelToEdit);

  // Available destinations list fetched from MongoDB
  const [destinations, setDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    destination: "",
    country: "",
    description: "",
    image: "",
    galleryText: "",
    pricePerNight: "",
    currency: "INR",
    amenitiesText: "",
    address: "",
    latitude: "",
    longitude: "",
    featured: false,
    aiEligible: true,
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
        console.error("Error fetching destinations for modal dropdown:", err);
      } finally {
        setLoadingDestinations(false);
      }
    };

    fetchDestinations();
  }, [isOpen]);

  // Populate form fields on edit or reset on create
  useEffect(() => {
    if (!isOpen) return;

    if (hotelToEdit) {
      const destId =
        typeof hotelToEdit.destination === "object"
          ? hotelToEdit.destination?._id
          : hotelToEdit.destination;

      setFormData({
        name: hotelToEdit.name || "",
        destination: destId || "",
        country: hotelToEdit.country || "",
        description: hotelToEdit.description || "",
        image: hotelToEdit.image || "",
        galleryText: Array.isArray(hotelToEdit.gallery)
          ? hotelToEdit.gallery.join("\n")
          : "",
        pricePerNight: hotelToEdit.pricePerNight !== undefined ? String(hotelToEdit.pricePerNight) : "",
        currency: hotelToEdit.currency || "INR",
        amenitiesText: Array.isArray(hotelToEdit.amenities)
          ? hotelToEdit.amenities.join("\n")
          : "",
        address: hotelToEdit.address || "",
        latitude: hotelToEdit.latitude !== undefined && hotelToEdit.latitude !== null ? String(hotelToEdit.latitude) : "",
        longitude: hotelToEdit.longitude !== undefined && hotelToEdit.longitude !== null ? String(hotelToEdit.longitude) : "",
        featured: Boolean(hotelToEdit.featured),
        aiEligible: hotelToEdit.aiEligible !== undefined ? Boolean(hotelToEdit.aiEligible) : true,
      });
    } else {
      setFormData({
        name: "",
        destination: "",
        country: "",
        description: "",
        image: "",
        galleryText: "",
        pricePerNight: "",
        currency: "INR",
        amenitiesText: "Free WiFi\nSwimming Pool\nBreakfast Included\nAir Conditioning\nRoom Service",
        address: "",
        latitude: "",
        longitude: "",
        featured: false,
        aiEligible: true,
      });
    }

    setImageLoadError(false);
    setFormError(null);
  }, [isOpen, hotelToEdit]);

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

    if (name === "image") setImageLoadError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validations
    if (!formData.name.trim()) {
      setFormError("Hotel name is required.");
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
    if (!formData.description.trim()) {
      setFormError("Description is required.");
      return;
    }
    if (!formData.image.trim()) {
      setFormError("Main image URL is required.");
      return;
    }

    const priceNum = parseFloat(formData.pricePerNight);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Price per night must be a valid number greater than or equal to 0.");
      return;
    }

    if (formData.latitude.trim()) {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        setFormError("Latitude must be a number between -90 and 90.");
        return;
      }
    }

    if (formData.longitude.trim()) {
      const lon = parseFloat(formData.longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        setFormError("Longitude must be a number between -180 and 180.");
        return;
      }
    }

    // Format gallery & amenities arrays
    const galleryArray = formData.galleryText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const amenitiesArray = formData.amenitiesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name.trim(),
      destination: formData.destination,
      country: formData.country.trim(),
      description: formData.description.trim(),
      image: formData.image.trim(),
      gallery: galleryArray,
      pricePerNight: priceNum,
      currency: formData.currency,
      amenities: amenitiesArray,
      address: formData.address.trim(),
      latitude: formData.latitude.trim() ? parseFloat(formData.latitude) : 0,
      longitude: formData.longitude.trim() ? parseFloat(formData.longitude) : 0,
      featured: formData.featured,
      aiEligible: formData.aiEligible,
    };

    try {
      setSubmitting(true);

      const url = isEdit
        ? `/api/admin/hotels/${hotelToEdit._id}`
        : "/api/admin/hotels";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess(data.hotel);
        onClose();
      } else {
        setFormError(data.error || "Failed to save hotel.");
      }
    } catch (err) {
      console.error("Hotel submit error:", err);
      setFormError("Network error while submitting hotel details.");
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
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Hotel size={22} />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white">
                {isEdit ? "Edit Hotel Listing" : "Add New Hotel Listing"}
              </h2>
              <p className="text-xs text-slate-400">
                {isEdit
                  ? `Updating details for "${hotelToEdit?.name}"`
                  : "Create a verified hotel accommodation in MongoDB Atlas"}
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
              <strong>Rating & Reviews Protection:</strong> Star rating and review count are strictly managed by user reviews and cannot be edited manually.
            </span>
          </div>

          {/* SECTION 1: BASIC INFORMATION */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-coral-500 border-b border-borderLine pb-2 flex items-center gap-1.5">
              <Building2 size={14} /> Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Hotel Name */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-primaryText">
                  Hotel Name <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Taj Fort Aguada Resort & Spa"
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

              {/* Description */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-primaryText">
                  Description <span className="text-coral-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the hotel ambiance, views, and luxury experiences..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                  required
                />
              </div>

            </div>
          </div>

          {/* SECTION 2: MEDIA & PREVIEW */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-coral-500 border-b border-borderLine pb-2 flex items-center gap-1.5">
              <ImageIcon size={14} /> Media & Photos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              
              <div className="sm:col-span-2 space-y-3">
                {/* Main Image URL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primaryText">
                    Main Image URL <span className="text-coral-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                    required
                  />
                </div>

                {/* Gallery URLs */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primaryText flex items-center justify-between">
                    <span>Gallery Image URLs</span>
                    <span className="text-[10px] text-mutedText">(One URL per line)</span>
                  </label>
                  <textarea
                    name="galleryText"
                    rows={3}
                    value={formData.galleryText}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/photo-1&#10;https://images.unsplash.com/photo-2"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-mono text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                  />
                </div>
              </div>

              {/* Image Preview Box */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-primaryText block">Image Preview</label>
                <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-slate-100 border border-borderLine flex items-center justify-center text-center p-2">
                  {formData.image && !imageLoadError ? (
                    <Image
                      src={formData.image}
                      alt="Hotel preview"
                      fill
                      className="object-cover"
                      onError={() => setImageLoadError(true)}
                    />
                  ) : (
                    <div className="space-y-1 text-mutedText">
                      <ImageIcon size={24} className="mx-auto text-slate-300" />
                      <span className="text-[10px] block font-medium">
                        {imageLoadError ? "Failed to load image" : "No image preview"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 3: PRICING & DETAILS */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-coral-500 border-b border-borderLine pb-2 flex items-center gap-1.5">
              <DollarSign size={14} /> Pricing & Amenities
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Price Per Night */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-primaryText">
                  Price Per Night <span className="text-coral-500">*</span>
                </label>
                <input
                  type="number"
                  name="pricePerNight"
                  min="0"
                  step="any"
                  value={formData.pricePerNight}
                  onChange={handleChange}
                  placeholder="e.g. 18000"
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

              {/* Address */}
              <div className="space-y-1 sm:col-span-1">
                <label className="text-xs font-bold text-primaryText">Address / Location</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Sinquerim Beach, Candolim, Goa"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                />
              </div>

              {/* Amenities */}
              <div className="space-y-1 sm:col-span-3">
                <label className="text-xs font-bold text-primaryText flex items-center justify-between">
                  <span>Hotel Amenities</span>
                  <span className="text-[10px] text-mutedText">(One amenity per line)</span>
                </label>
                <textarea
                  name="amenitiesText"
                  rows={3}
                  value={formData.amenitiesText}
                  onChange={handleChange}
                  placeholder="Free WiFi&#10;Swimming Pool&#10;Breakfast Included&#10;Spa & Wellness"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-medium text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                />
              </div>

            </div>
          </div>

          {/* SECTION 4: LOCATION COORDINATES & SETTINGS */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-coral-500 border-b border-borderLine pb-2 flex items-center gap-1.5">
              <Compass size={14} /> Map Coordinates & System Visibility
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Latitude */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-primaryText">Latitude (-90 to 90)</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g. 15.5034"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-mono text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                />
              </div>

              {/* Longitude */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-primaryText">Longitude (-180 to 180)</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g. 73.7667"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondaryBg border border-borderLine text-xs font-mono text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                />
              </div>

              {/* Featured Checkbox */}
              <div className="p-3.5 rounded-2xl bg-secondaryBg border border-borderLine flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-primaryText block">Featured Hotel</span>
                  <span className="text-[10px] text-mutedText block">Highlight on home and hotel sections</span>
                </div>
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-coral-500 focus:ring-coral-500"
                />
              </div>

              {/* AI Eligible Checkbox */}
              <div className="p-3.5 rounded-2xl bg-secondaryBg border border-borderLine flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-primaryText flex items-center gap-1">
                    <Sparkles size={13} className="text-coral-500" /> AI Eligible
                  </span>
                  <span className="text-[10px] text-mutedText block">Allow Gemini AI Trip Planner recommendations</span>
                </div>
                <input
                  type="checkbox"
                  name="aiEligible"
                  checked={formData.aiEligible}
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
                <span>Saving Hotel...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{isEdit ? "Update Hotel" : "Create Hotel"}</span>
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}

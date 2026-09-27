"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import {
  Compass,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Image as ImageIcon,
  Languages,
  Award,
  DollarSign,
  Calendar,
  FileText,
  UploadCloud,
  FileCheck,
  Trash2,
  ShieldCheck,
  Loader2,
  Paperclip,
} from "lucide-react";

const DOCUMENT_TYPES = [
  { value: "GOVERNMENT_ID", label: "Government ID (Passport / License / National ID)", required: true },
  { value: "EXPERIENCE_CERTIFICATE", label: "Experience Certificate", required: false },
  { value: "TOURISM_CERTIFICATE", label: "Tourism / Guide Certificate", required: false },
  { value: "GUIDE_LICENSE", label: "Guide License / Permit", required: false },
  { value: "LANGUAGE_CERTIFICATE", label: "Language Certificate", required: false },
  { value: "OTHER", label: "Other Supporting Document", required: false },
];

export default function GuideApplyPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingApplication, setPendingApplication] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Profile Photo Upload State
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Verification Documents State
  const [verificationDocs, setVerificationDocs] = useState([]);
  const [selectedDocType, setSelectedDocType] = useState("GOVERNMENT_ID");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docError, setDocError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    destination: "",
    profileImage: "",
    languages: "English",
    specialties: "City Tours, Cultural Heritage, Local Cuisine",
    experienceYears: "2",
    bio: "",
    hourlyRate: "500",
    currency: "INR",
    availability: "Flexible / Weekends",
    motivation: "",
  });

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        // 1. Fetch current user session
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) {
          router.push("/sign-in?redirect=/guide/apply");
          return;
        }
        const userData = await userRes.json();
        if (!userData.authenticated || !userData.user) {
          router.push("/sign-in?redirect=/guide/apply");
          return;
        }

        if (userData.user.role === "ADMIN") {
          router.push("/admin");
          return;
        }

        setCurrentUser(userData.user);

        setFormData((prev) => ({
          ...prev,
          fullName: userData.user.name || "",
          email: userData.user.email || "",
          phone: userData.user.phone || "",
          country: userData.user.country || "",
        }));

        if (userData.user.profileImage) {
          setProfilePhoto({
            secureUrl: userData.user.profileImage,
            fileName: "Existing Profile Image",
          });
        }

        // 2. Fetch destinations
        const destRes = await fetch("/api/destinations");
        const destData = await destRes.json();
        if (destData.success && Array.isArray(destData.data)) {
          setDestinations(destData.data);
          if (destData.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              destination: prev.destination || destData.data[0]._id,
            }));
          }
        }

        // 3. Check for pending application
        const pendingRes = await fetch("/api/guide-applications/me/pending");
        const pendingData = await pendingRes.json();
        if (pendingData.success && pendingData.hasPending) {
          setPendingApplication(pendingData.data);
        }
      } catch (err) {
        console.error("Failed to load initial data for guide application:", err);
        setError("Failed to load initial form data. Please refresh.");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helper for Uploading File to Cloudinary Endpoint
  const handleFileUpload = async (file, category) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);

    const res = await fetch("/api/guide-applications/upload-signature", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to upload file.");
    }
    return data.data;
  };

  // Handle Profile Photo Upload
  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileError("");
    setUploadingProfile(true);

    try {
      const uploadedData = await handleFileUpload(file, "profile");
      setProfilePhoto(uploadedData);
      setFormData((prev) => ({ ...prev, profileImage: uploadedData.secureUrl }));
    } catch (err) {
      setProfileError(err.message || "Failed to upload profile photo.");
    } finally {
      setUploadingProfile(false);
    }
  };

  // Handle Verification Document Upload
  const handleDocUploadChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocError("");
    setUploadingDoc(true);

    try {
      const uploadedData = await handleFileUpload(file, "document");
      
      const newDoc = {
        type: selectedDocType,
        fileName: uploadedData.fileName || file.name,
        publicId: uploadedData.publicId,
        secureUrl: uploadedData.secureUrl,
        resourceType: uploadedData.resourceType || "image",
        fileSize: uploadedData.fileSize || file.size,
        status: "PENDING",
      };

      setVerificationDocs((prev) => {
        const filtered = prev.filter((d) => d.type !== selectedDocType);
        return [...filtered, newDoc];
      });

      e.target.value = "";
    } catch (err) {
      setDocError(err.message || "Failed to upload verification document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeDoc = (typeToRemove) => {
    setVerificationDocs((prev) => prev.filter((d) => d.type !== typeToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName.trim()) {
      setError("Full Name is required.");
      return;
    }

    if (!formData.destination) {
      setError("Please select a preferred destination.");
      return;
    }

    const currentProfileUrl = profilePhoto?.secureUrl || formData.profileImage;
    if (!currentProfileUrl) {
      setError("Profile Photo is required. Please upload your profile photo.");
      return;
    }

    const hasGovId = verificationDocs.some(
      (d) => d.type === "GOVERNMENT_ID" && d.secureUrl
    );
    if (!hasGovId) {
      setError("Government ID document is required for identity verification.");
      return;
    }

    if (!formData.bio.trim()) {
      setError("Short Bio is required.");
      return;
    }

    if (!formData.motivation.trim()) {
      setError("Motivation statement is required.");
      return;
    }

    const rate = Number(formData.hourlyRate);
    if (isNaN(rate) || rate < 0) {
      setError("Hourly rate must be a valid non-negative number.");
      return;
    }

    const exp = Number(formData.experienceYears);
    if (isNaN(exp) || exp < 0) {
      setError("Years of experience must be a valid non-negative number.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/guide-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          country: formData.country.trim(),
          destination: formData.destination,
          profileImage: currentProfileUrl,
          profileImageMetadata: profilePhoto || { secureUrl: currentProfileUrl },
          verificationDocuments: verificationDocs,
          languages: formData.languages,
          specialties: formData.specialties,
          experienceYears: exp,
          bio: formData.bio.trim(),
          hourlyRate: rate,
          currency: formData.currency,
          availability: formData.availability.trim(),
          motivation: formData.motivation.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to submit guide application.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setPendingApplication(data.data);
    } catch (err) {
      console.error("Guide application submission error:", err);
      setError("Network error occurred while submitting your application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 bg-white min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-coral-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-mutedText">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (currentUser && currentUser.role === "LOCAL_GUIDE") {
    return (
      <div className="py-16 bg-white min-h-[85vh]">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-primaryText">
            You are already a Travellow Local Guide.
          </h1>
          <p className="text-bodyText text-sm sm:text-base">
            Your account role is active as a Local Guide. You can manage your traveler bookings and guide profile directly from your dashboard.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
            <Link href={`/guides?search=${encodeURIComponent(currentUser.name || "")}`} className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full">
                View Guide Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pendingApplication || success) {
    return (
      <div className="py-16 bg-white min-h-[85vh]">
        <div className="max-w-2xl mx-auto px-4 space-y-8">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Clock size={36} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <Badge variant="warning" className="uppercase tracking-wider px-3 py-1 font-bold">
                PENDING — Waiting for admin review
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-primaryText pt-2">
                Your guide application has been submitted successfully.
              </h1>
              <p className="text-bodyText text-sm leading-relaxed max-w-lg mx-auto">
                Thank you for applying to become a Travellow Local Guide! Our admin team is reviewing your application and submitted verification documents.
              </p>
            </div>

            {pendingApplication && (
              <div className="bg-white p-6 rounded-2xl border border-amber-200 text-left space-y-3 text-xs sm:text-sm text-bodyText">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="font-semibold text-primaryText">Applicant:</span>
                  <span>{pendingApplication.fullName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="font-semibold text-primaryText">Target Destination:</span>
                  <span>{pendingApplication.destination?.name || "Selected Destination"}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="font-semibold text-primaryText">Submitted Documents:</span>
                  <span>
                    {pendingApplication.verificationDocuments?.length || 1} Document(s) Attached
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-primaryText">Submitted On:</span>
                  <span>{new Date(pendingApplication.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Link href="/dashboard">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50/50 min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-borderLine shadow-sm text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-coral-500 uppercase tracking-widest bg-coral-50 px-3 py-1 rounded-full">
            <Compass size={16} />
            <span>Local Guide Application</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-primaryText tracking-tight">
            Become a Local Guide
          </h1>
          <p className="text-bodyText text-sm sm:text-base max-w-xl mx-auto">
            Share your local knowledge, submit identity verification documents, and join Travellow's vetted network of tour guides.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm">
            <AlertCircle size={20} className="shrink-0 text-red-500" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Application Form Card */}
        <Card className="p-6 sm:p-10 shadow-sm border border-borderLine bg-white rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Personal Details */}
            <div className="space-y-6 pb-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
                <User className="text-coral-500" size={20} />
                Personal Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100 text-mutedText cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                    Country of Residence
                  </label>
                  <Input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g. India, UAE, France"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Destination & Profile Photo */}
            <div className="space-y-6 pb-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
                <MapPin className="text-coral-500" size={20} />
                Guide Destination & Profile Photo
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                <div>
                  <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                    Preferred Destination *
                  </label>
                  <select
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-secondaryBg border border-borderLine rounded-xl text-primaryText font-medium text-sm focus:outline-none focus:ring-2 focus:ring-coral-500"
                    required
                  >
                    {destinations.length === 0 && (
                      <option value="">No destinations loaded</option>
                    )}
                    {destinations.map((dest) => (
                      <option key={dest._id} value={dest._id}>
                        {dest.name} ({dest.country})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Profile Photo Cloudinary Uploader */}
                <div>
                  <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                    Profile Photo * (JPG, PNG, WEBP - Max 5MB)
                  </label>

                  {profileError && (
                    <p className="text-xs text-red-600 font-medium mb-2">{profileError}</p>
                  )}

                  {profilePhoto ? (
                    <div className="flex items-center gap-4 p-3 bg-secondaryBg border border-borderLine rounded-2xl">
                      <img
                        src={profilePhoto.secureUrl}
                        alt="Profile preview"
                        className="w-16 h-16 rounded-xl object-cover border border-coral-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primaryText truncate">
                          {profilePhoto.fileName || "profile_photo.jpg"}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-0.5">
                          <CheckCircle2 size={12} /> Uploaded to Cloudinary
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePhoto(null);
                          setFormData((prev) => ({ ...prev, profileImage: "" }));
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                        title="Remove photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-borderLine hover:border-coral-500 rounded-2xl p-4 text-center transition-colors bg-secondaryBg/50">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleProfileImageChange}
                        disabled={uploadingProfile}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                      />
                      <div className="flex flex-col items-center gap-1 text-xs text-bodyText">
                        {uploadingProfile ? (
                          <>
                            <Loader2 size={24} className="text-coral-500 animate-spin" />
                            <span className="font-semibold text-coral-600">Uploading photo...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={24} className="text-coral-500 mb-1" />
                            <span className="font-bold text-primaryText">Click or drop profile photo</span>
                            <span className="text-mutedText text-[11px]">JPG, PNG, WEBP up to 5 MB</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Verification Documents Upload Section */}
            <div className="space-y-6 pb-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
                  <ShieldCheck className="text-coral-500" size={20} />
                  Verification Documents
                </h2>
                <p className="text-xs text-bodyText mt-1">
                  Government-issued identification is collected for identity verification. Additional certificates or permits can be submitted when applicable.
                </p>
              </div>

              {docError && (
                <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {docError}
                </p>
              )}

              {/* Upload Input Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end bg-secondaryBg p-4 rounded-2xl border border-borderLine">
                <div className="sm:col-span-7">
                  <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                    Document Type to Attach
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-borderLine rounded-xl text-primaryText font-medium text-xs focus:outline-none focus:ring-2 focus:ring-coral-500"
                  >
                    {DOCUMENT_TYPES.map((dt) => (
                      <option key={dt.value} value={dt.value}>
                        {dt.label} {dt.required ? "*" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-5 relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleDocUploadChange}
                    disabled={uploadingDoc}
                    id="verification-doc-input"
                    className="hidden"
                  />
                  <label
                    htmlFor="verification-doc-input"
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${
                      uploadingDoc
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-coral-500 hover:bg-coral-600 text-white"
                    }`}
                  >
                    {uploadingDoc ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        Upload {selectedDocType === "GOVERNMENT_ID" ? "Government ID *" : "Document"}
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-primaryText border-b border-gray-100 pb-2">
                  <span>Attached Documents ({verificationDocs.length})</span>
                  <span className="text-coral-500 text-[11px]">Government ID Required *</span>
                </div>

                {verificationDocs.length === 0 ? (
                  <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs text-mutedText">
                    No documents uploaded yet. <strong className="text-coral-600">Government ID is required</strong> to submit application.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {verificationDocs.map((doc) => {
                      const docTypeInfo = DOCUMENT_TYPES.find((t) => t.value === doc.type);
                      const isGovId = doc.type === "GOVERNMENT_ID";
                      return (
                        <div
                          key={doc.type}
                          className="flex items-center justify-between p-3.5 bg-white border border-borderLine rounded-2xl shadow-sm text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-xl shrink-0 ${isGovId ? "bg-coral-50 text-coral-600" : "bg-blue-50 text-blue-600"}`}>
                              <FileCheck size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primaryText">
                                  {docTypeInfo?.label || doc.type}
                                </span>
                                {isGovId && (
                                  <Badge variant="coral" className="text-[10px] py-0 px-1.5">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              <p className="text-mutedText text-[11px] truncate mt-0.5">
                                {doc.fileName} • Cloudinary Attached
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <Badge variant="success" className="text-[10px]">
                              Ready
                            </Badge>
                            <button
                              type="button"
                              onClick={() => removeDoc(doc.type)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Remove document"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Expertise & Pricing */}
            <div className="space-y-6 pb-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
                <Award className="text-coral-500" size={20} />
                Expertise & Pricing
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                    Years of Experience *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                    Hourly Rate *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                    Currency *
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-secondaryBg border border-borderLine rounded-xl text-primaryText font-medium text-sm focus:outline-none focus:ring-2 focus:ring-coral-500"
                    required
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="AED">AED (AED)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                    Languages Spoken (comma separated) *
                  </label>
                  <Input
                    type="text"
                    name="languages"
                    value={formData.languages}
                    onChange={handleChange}
                    placeholder="English, French, Hindi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                    Specialties (comma separated) *
                  </label>
                  <Input
                    type="text"
                    name="specialties"
                    value={formData.specialties}
                    onChange={handleChange}
                    placeholder="Historical Tours, Food & Wine, Photography"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                  Availability Schedule
                </label>
                <Input
                  type="text"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  placeholder="e.g. Weekends, Daily 9 AM - 5 PM"
                />
              </div>
            </div>

            {/* Section 5: Bio & Motivation */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
                <FileText className="text-coral-500" size={20} />
                Bio & Motivation
              </h2>

              <div>
                <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                  Short Bio *
                </label>
                <textarea
                  name="bio"
                  rows="3"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Introduce yourself to prospective travelers. Describe your background and passion for local guiding..."
                  className="w-full p-4 bg-secondaryBg border border-borderLine rounded-xl text-primaryText font-medium text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 resize-y"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-primaryText uppercase tracking-wider mb-2">
                  Why do you want to become a guide? *
                </label>
                <textarea
                  name="motivation"
                  rows="3"
                  value={formData.motivation}
                  onChange={handleChange}
                  placeholder="Tell us why you want to join Travellow as an authorized local guide..."
                  className="w-full p-4 bg-secondaryBg border border-borderLine rounded-xl text-primaryText font-medium text-sm focus:outline-none focus:ring-2 focus:ring-coral-500 resize-y"
                  required
                ></textarea>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-gray-100">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button type="button" variant="outline" size="lg" className="w-full">
                  Cancel
                </Button>
              </Link>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting || uploadingProfile || uploadingDoc}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting Application...
                  </>
                ) : (
                  <>
                    Submit Guide Application
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </div>

          </form>
        </Card>

      </div>
    </div>
  );
}

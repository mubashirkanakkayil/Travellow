"use me";
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  Compass,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  DollarSign,
  Award,
  Globe,
  User,
  ExternalLink,
} from "lucide-react";

export default function GuideStatusCard({ userRole }) {
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);

  useEffect(() => {
    async function fetchGuideStatus() {
      try {
        setLoading(true);
        const res = await fetch("/api/guide-applications/me");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setApplication(json.data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch guide status card data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (userRole !== "ADMIN") {
      fetchGuideStatus();
    } else {
      setLoading(false);
    }
  }, [userRole]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-borderLine space-y-2 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
      </div>
    );
  }

  // 1. ACTIVE LOCAL GUIDE Panel View (for LOCAL_GUIDE role or APPROVED application)
  if (userRole === "LOCAL_GUIDE" || (application && application.status === "APPROVED")) {
    const guideName = application?.fullName || "Verified Local Guide";
    const destName = application?.destination?.name || "Assigned Destination";
    const hourlyRate = application ? `${application.currency} ${application.hourlyRate}` : "Standard Rate";
    const expYears = application?.experienceYears ?? 3;
    const languages = application?.languages?.join(", ") || "English";
    const specialties = application?.specialties?.join(", ") || "Local Sightseeing";

    return (
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200/80">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-xl text-primaryText">
                  Local Guide Control Panel
                </h3>
                <Badge variant="success" className="bg-emerald-600 text-white font-bold">
                  VERIFIED GUIDE
                </Badge>
              </div>
              <p className="text-bodyText text-xs sm:text-sm mt-1">
                Your account is active as an authorized Travellow Local Guide. Your profile is live on the public Local Guides page.
              </p>
            </div>
          </div>

          <Link href={`/guides?search=${encodeURIComponent(guideName)}`}>
            <Button variant="primary" size="sm" className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white border-none flex items-center gap-1.5">
              <span>View Public Guide Profile</span>
              <ExternalLink size={14} />
            </Button>
          </Link>
        </div>

        {/* Profile Card Breakdown */}
        {application && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 space-y-1">
              <span className="text-mutedText font-semibold uppercase flex items-center gap-1">
                <MapPin size={13} className="text-emerald-600" /> Destination
              </span>
              <p className="font-bold text-primaryText text-sm">{destName}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 space-y-1">
              <span className="text-mutedText font-semibold uppercase flex items-center gap-1">
                <DollarSign size={13} className="text-emerald-600" /> Hourly Rate
              </span>
              <p className="font-bold text-primaryText text-sm">{hourlyRate} / hr</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 space-y-1">
              <span className="text-mutedText font-semibold uppercase flex items-center gap-1">
                <Award size={13} className="text-emerald-600" /> Experience
              </span>
              <p className="font-bold text-primaryText text-sm">{expYears} Years</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 space-y-1">
              <span className="text-mutedText font-semibold uppercase flex items-center gap-1">
                <Globe size={13} className="text-emerald-600" /> Languages
              </span>
              <p className="font-bold text-primaryText text-sm truncate">{languages}</p>
            </div>
          </div>
        )}

      </div>
    );
  }

  // 2. PENDING State
  if (application && application.status === "PENDING") {
    const hasProfilePhoto = Boolean(application.profileImage || application.profileImageMetadata?.secureUrl);
    const govIdDoc = application.verificationDocuments?.find((d) => d.type === "GOVERNMENT_ID");
    const otherDocs = application.verificationDocuments?.filter((d) => d.type !== "GOVERNMENT_ID") || [];

    const isGovIdVerified = govIdDoc?.status === "VERIFIED";
    const isGovIdRejected = govIdDoc?.status === "REJECTED";

    return (
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={26} className="animate-spin" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-primaryText">
                  Guide Application Under Review
                </h3>
                <Badge variant="warning">PENDING ADMIN APPROVAL</Badge>
              </div>
              <p className="text-bodyText text-xs sm:text-sm leading-relaxed max-w-2xl">
                Your registration and verification documents have been submitted. Our administrators are reviewing your documents before updating your role to <strong>LOCAL_GUIDE</strong>.
              </p>
              {application.destination && (
                <div className="mt-1 text-xs text-amber-800 bg-amber-100/60 p-2.5 rounded-xl inline-block border border-amber-200/60">
                  Target Destination: <strong>{application.destination.name}</strong> • Submitted: {new Date(application.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" disabled className="shrink-0 opacity-70 bg-white">
            Waiting for Admin Review
          </Button>
        </div>

        {/* Verification Document Progress Breakdown */}
        <div className="pt-3 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between">
            <span className="font-medium text-bodyText">Profile Photo</span>
            {hasProfilePhoto ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 size={13} /> Uploaded
              </span>
            ) : (
              <span className="text-red-600 font-bold">Missing</span>
            )}
          </div>

          <div className="p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between">
            <span className="font-medium text-bodyText">Government ID</span>
            {isGovIdVerified ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 size={13} /> Verified
              </span>
            ) : isGovIdRejected ? (
              <span className="text-red-600 font-bold flex items-center gap-1">
                <XCircle size={13} /> Rejected
              </span>
            ) : (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <Clock size={13} /> Pending Review
              </span>
            )}
          </div>

          <div className="p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between">
            <span className="font-medium text-bodyText">Supporting Certificates</span>
            <span className="text-primaryText font-bold">
              {otherDocs.length > 0 ? `${otherDocs.length} Attached` : "None Attached"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. REJECTED State
  if (application && application.status === "REJECTED") {
    return (
      <div className="bg-red-50/70 border border-red-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <XCircle size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-primaryText">
                  Guide Application Decision
                </h3>
                <Badge variant="coral">REJECTED</Badge>
              </div>
              <p className="text-bodyText text-xs sm:text-sm mt-1">
                Your previous guide application was rejected by the admin team.
              </p>
              {application.adminNote && (
                <div className="mt-2 p-3 bg-white/90 rounded-xl border border-red-200 text-xs text-red-800">
                  <span className="font-bold">Admin Note: </span>
                  {application.adminNote}
                </div>
              )}
            </div>
          </div>
          <Link href="/guide/apply">
            <Button variant="primary" size="sm" className="shrink-0">
              Apply Again
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 4. NO Application State
  return (
    <div className="bg-gradient-to-r from-coral-50/60 to-orange-50/60 border border-coral-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-coral-100 text-coral-600 flex items-center justify-center shrink-0">
            <Compass size={26} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-primaryText">
              Become a Local Guide
            </h3>
            <p className="text-bodyText text-xs sm:text-sm mt-1 max-w-xl">
              Share your local knowledge and help travelers experience destinations better. Apply to join as a verified Travellow guide.
            </p>
          </div>
        </div>
        <Link href="/guide/apply">
          <Button variant="primary" size="sm" className="shrink-0 flex items-center gap-1.5">
            Apply as a Guide
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
}

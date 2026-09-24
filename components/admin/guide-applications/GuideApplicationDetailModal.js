"use me";
"use client";

import React, { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  X,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function GuideApplicationDetailModal({
  application,
  onClose,
  onActionComplete,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState("");

  if (!application) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success">APPROVED</Badge>;
      case "REJECTED":
        return <Badge variant="coral">REJECTED</Badge>;
      case "PENDING":
      default:
        return <Badge variant="warning">PENDING REVIEW</Badge>;
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      setError("");

      const res = await fetch(`/api/admin/guide-applications/${application._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE", adminNote }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to approve application.");
        setSubmitting(false);
        return;
      }

      onActionComplete();
    } catch (err) {
      console.error("Approve application error:", err);
      setError("Network error occurred while approving application.");
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");

      const res = await fetch(`/api/admin/guide-applications/${application._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          adminNote: adminNote.trim() || "Application rejected by administrator.",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to reject application.");
        setSubmitting(false);
        return;
      }

      onActionComplete();
    } catch (err) {
      console.error("Reject application error:", err);
      setError("Network error occurred while rejecting application.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-borderLine shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-borderLine flex items-center justify-between shrink-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-coral-100 text-coral-600 flex items-center justify-center">
              <User size={22} />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-primaryText">
                Guide Application Review
              </h2>
              <p className="text-xs text-mutedText">
                Submitted on {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(application.status)}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm">
              <AlertCircle size={20} className="shrink-0 text-red-500" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Applicant Summary Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-secondaryBg border border-borderLine">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-200 shrink-0 border border-borderLine">
              {application.profileImage ? (
                <img
                  src={application.profileImage}
                  alt={application.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User size={28} />
                </div>
              )}
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="font-bold text-lg text-primaryText">{application.fullName}</h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-bodyText">
                <span className="flex items-center gap-1">
                  <Mail size={14} className="text-coral-500" /> {application.email}
                </span>
                {application.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={14} className="text-coral-500" /> {application.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Globe size={14} className="text-coral-500" /> {application.country || "India"}
                </span>
              </div>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Preferred Destination */}
            <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} className="text-coral-500" /> Target Destination
              </span>
              <p className="font-bold text-primaryText text-base">
                {application.destination?.name || "Selected Destination"}
              </p>
              <p className="text-xs text-mutedText">{application.destination?.country}</p>
            </div>

            {/* Rates & Experience */}
            <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} className="text-coral-500" /> Hourly Rate & Experience
              </span>
              <p className="font-bold text-primaryText text-base">
                {application.currency} {application.hourlyRate} / hr
              </p>
              <p className="text-xs text-mutedText">
                {application.experienceYears} Years Experience
              </p>
            </div>

            {/* Languages */}
            <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                Languages Spoken
              </span>
              <p className="text-sm font-semibold text-primaryText">
                {Array.isArray(application.languages)
                  ? application.languages.join(", ")
                  : application.languages}
              </p>
            </div>

            {/* Specialties */}
            <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                Specialties
              </span>
              <p className="text-sm font-semibold text-primaryText">
                {Array.isArray(application.specialties) && application.specialties.length > 0
                  ? application.specialties.join(", ")
                  : "General Guiding"}
              </p>
            </div>

          </div>

          {/* Availability */}
          {application.availability && (
            <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-coral-500" /> Availability
              </span>
              <p className="text-sm font-medium text-primaryText">{application.availability}</p>
            </div>
          )}

          {/* Bio */}
          <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
            <span className="text-xs font-semibold text-mutedText uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-coral-500" /> Short Bio
            </span>
            <p className="text-sm text-bodyText leading-relaxed whitespace-pre-line">
              {application.bio}
            </p>
          </div>

          {/* Motivation */}
          <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
            <span className="text-xs font-semibold text-mutedText uppercase tracking-wider flex items-center gap-1.5">
              <Award size={14} className="text-coral-500" /> Application Motivation
            </span>
            <p className="text-sm text-bodyText leading-relaxed whitespace-pre-line">
              {application.motivation}
            </p>
          </div>

          {/* Admin Note if already reviewed */}
          {application.status !== "PENDING" && (
            <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine space-y-2">
              <div className="flex justify-between items-center text-xs text-mutedText">
                <span>
                  Reviewed by: <span className="font-semibold text-primaryText">{application.reviewedBy?.name || "Admin"}</span>
                </span>
                {application.reviewedAt && (
                  <span>Reviewed on: {new Date(application.reviewedAt).toLocaleDateString()}</span>
                )}
              </div>
              {application.adminNote && (
                <p className="text-xs text-bodyText">
                  <span className="font-semibold">Note:</span> {application.adminNote}
                </p>
              )}
            </div>
          )}

          {/* Rejection Note Input form */}
          {rejecting && (
            <form onSubmit={handleRejectSubmit} className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3">
              <h4 className="font-bold text-sm text-red-800">Confirm Rejection</h4>
              <p className="text-xs text-red-700">
                Please provide an optional rejection reason or feedback for the user:
              </p>
              <textarea
                rows="3"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g. Please provide more detailed guiding background and verify experience..."
                className="w-full p-3 bg-white border border-red-300 rounded-xl text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-red-500"
              ></textarea>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejecting(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="coral"
                  size="sm"
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white border-none"
                >
                  {submitting ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer Actions - Fixed Opaque Bottom Bar */}
        <div className="p-6 border-t border-borderLine bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 rounded-b-3xl">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Close
          </Button>

          {application.status === "PENDING" && !rejecting && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setRejecting(true)}
                disabled={submitting}
                className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle size={16} />
                Reject Application
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleApprove}
                disabled={submitting}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 border-none text-white"
              >
                {submitting ? (
                  "Approving..."
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Approve Application
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

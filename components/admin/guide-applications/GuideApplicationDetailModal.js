"use client";

import React, { useState, useEffect } from "react";
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
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function GuideApplicationDetailModal({
  application,
  onClose,
  onActionComplete,
}) {
  const [currentApp, setCurrentApp] = useState(application);
  const [submitting, setSubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState("");
  const [updatingDocType, setUpdatingDocType] = useState(null);
  const [docActionError, setDocActionError] = useState("");

  useEffect(() => {
    setCurrentApp(application);
  }, [application]);

  if (!currentApp) return null;

  const handleVerifyDocument = async (docType, action, note = "") => {
    try {
      setUpdatingDocType(docType);
      setDocActionError("");

      const res = await fetch(`/api/admin/guide-applications/${currentApp._id}/documents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: docType,
          action,
          adminNote: note,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDocActionError(data.error || "Failed to update document verification status.");
        return;
      }

      // Update current application state in modal locally so modal stays open with updated doc status
      if (data.data) {
        setCurrentApp(data.data);
      }
    } catch (err) {
      console.error("Error verifying document:", err);
      setDocActionError("Network error while updating document status.");
    } finally {
      setUpdatingDocType(null);
    }
  };

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

      const res = await fetch(`/api/admin/guide-applications/${currentApp._id}`, {
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

      if (onActionComplete) {
        onActionComplete();
      }
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

      const res = await fetch(`/api/admin/guide-applications/${currentApp._id}`, {
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

      if (onActionComplete) {
        onActionComplete();
      }
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
                Submitted on {new Date(currentApp.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(currentApp.status)}
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

          {/* Profile Photo Card */}
          <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-200 shrink-0 border border-borderLine shadow-sm">
                {currentApp.profileImage ? (
                  <img
                    src={currentApp.profileImage}
                    alt={currentApp.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User size={28} />
                  </div>
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-coral-600 uppercase tracking-wider block">
                  Profile Photo
                </span>
                <p className="font-bold text-primaryText text-sm mt-0.5">{currentApp.fullName}</p>
                <p className="text-xs text-mutedText truncate max-w-xs">
                  {currentApp.profileImageMetadata?.fileName || "profile_photo.jpg"}
                </p>
              </div>
            </div>
            {currentApp.profileImage && (
              <a
                href={currentApp.profileImage}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white border border-borderLine text-xs font-semibold text-primaryText hover:border-coral-500 hover:text-coral-600 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink size={14} />
                View Full Photo
              </a>
            )}
          </div>

          {/* Verification Documents Review Section */}
          <div className="p-5 rounded-2xl bg-white border border-borderLine space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-primaryText flex items-center gap-2">
                  <ShieldCheck size={18} className="text-coral-500" />
                  Verification Documents ({currentApp.verificationDocuments?.length || 0})
                </h3>
                <p className="text-xs text-mutedText mt-0.5">
                  Review and verify submitted Government ID and certificates.
                </p>
              </div>
            </div>

            {docActionError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                {docActionError}
              </div>
            )}

            {!currentApp.verificationDocuments || currentApp.verificationDocuments.length === 0 ? (
              <div className="p-4 bg-gray-50 text-center rounded-xl text-xs text-mutedText">
                No verification documents submitted with this application.
              </div>
            ) : (
              <div className="space-y-3">
                {currentApp.verificationDocuments.map((doc) => {
                  const isGovId = doc.type === "GOVERNMENT_ID";
                  const isVerified = doc.status === "VERIFIED";
                  const isRejected = doc.status === "REJECTED";

                  return (
                    <div
                      key={doc._id || doc.type}
                      className="p-4 rounded-xl bg-secondaryBg border border-borderLine space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${isGovId ? "bg-coral-100 text-coral-600" : "bg-blue-100 text-blue-600"}`}>
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-primaryText">
                                {doc.type.replace(/_/g, " ")}
                              </span>
                              {isGovId && (
                                <Badge variant="coral" className="text-[10px] py-0 px-1.5 font-bold">
                                  REQUIRED
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-mutedText truncate mt-0.5">
                              {doc.fileName || "verification_document"} • Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "recently"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isVerified && <Badge variant="success">VERIFIED</Badge>}
                          {isRejected && <Badge variant="coral">REJECTED</Badge>}
                          {!isVerified && !isRejected && <Badge variant="warning">PENDING</Badge>}

                          {doc.secureUrl && (
                            <a
                              href={doc.secureUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-white border border-borderLine rounded-lg text-xs font-semibold text-primaryText hover:border-coral-500 hover:text-coral-600 transition-colors flex items-center gap-1"
                            >
                              <ExternalLink size={13} />
                              Open
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Admin Verification Controls per document */}
                      <div className="pt-2 border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-mutedText">
                          {doc.adminNote && (
                            <span className="text-red-600 font-medium">Note: {doc.adminNote}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleVerifyDocument(doc.type, "VERIFY")}
                            disabled={updatingDocType === doc.type || isVerified}
                            className="px-3 py-1.5 rounded-lg font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 size={13} />
                            {isVerified ? "Verified" : "Verify Document"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const note = prompt("Enter rejection note for this document:", doc.adminNote || "");
                              if (note !== null) {
                                handleVerifyDocument(doc.type, "REJECT", note);
                              }
                            }}
                            disabled={updatingDocType === doc.type}
                            className="px-3 py-1.5 rounded-lg font-semibold bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors flex items-center gap-1"
                          >
                            <XCircle size={13} />
                            {isRejected ? "Rejected" : "Reject Document"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Preferred Destination */}
            <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} className="text-coral-500" /> Target Destination
              </span>
              <p className="font-bold text-primaryText text-base">
                {currentApp.destination?.name || "Selected Destination"}
              </p>
              <p className="text-xs text-mutedText">{currentApp.destination?.country}</p>
            </div>

            {/* Rates & Experience */}
            <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} className="text-coral-500" /> Hourly Rate & Experience
              </span>
              <p className="font-bold text-primaryText text-base">
                {currentApp.currency} {currentApp.hourlyRate} / hr
              </p>
              <p className="text-xs text-mutedText">
                {currentApp.experienceYears} Years Experience
              </p>
            </div>

            {/* Languages */}
            <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                Languages Spoken
              </span>
              <p className="text-sm font-semibold text-primaryText">
                {Array.isArray(currentApp.languages)
                  ? currentApp.languages.join(", ")
                  : currentApp.languages}
              </p>
            </div>

            {/* Specialties */}
            <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider">
                Specialties
              </span>
              <p className="text-sm font-semibold text-primaryText">
                {Array.isArray(currentApp.specialties) && currentApp.specialties.length > 0
                  ? currentApp.specialties.join(", ")
                  : "General Guiding"}
              </p>
            </div>

          </div>

          {/* Availability */}
          {currentApp.availability && (
            <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
              <span className="text-xs font-semibold text-mutedText uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-coral-500" /> Availability
              </span>
              <p className="text-sm font-medium text-primaryText">{currentApp.availability}</p>
            </div>
          )}

          {/* Bio */}
          <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
            <span className="text-xs font-semibold text-mutedText uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-coral-500" /> Short Bio
            </span>
            <p className="text-sm text-bodyText leading-relaxed whitespace-pre-line">
              {currentApp.bio}
            </p>
          </div>

          {/* Motivation */}
          <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
            <span className="text-xs font-semibold text-mutedText uppercase tracking-wider flex items-center gap-1.5">
              <Award size={14} className="text-coral-500" /> Application Motivation
            </span>
            <p className="text-sm text-bodyText leading-relaxed whitespace-pre-line">
              {currentApp.motivation}
            </p>
          </div>

          {/* Admin Note if already reviewed */}
          {currentApp.status !== "PENDING" && (
            <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine space-y-2">
              <div className="flex justify-between items-center text-xs text-mutedText">
                <span>
                  Reviewed by: <span className="font-semibold text-primaryText">{currentApp.reviewedBy?.name || "Admin"}</span>
                </span>
                {currentApp.reviewedAt && (
                  <span>Reviewed on: {new Date(currentApp.reviewedAt).toLocaleDateString()}</span>
                )}
              </div>
              {currentApp.adminNote && (
                <p className="text-xs text-bodyText">
                  <span className="font-semibold">Note:</span> {currentApp.adminNote}
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

          {currentApp.status === "PENDING" && !rejecting && (
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

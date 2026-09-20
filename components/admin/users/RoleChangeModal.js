"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const ROLES = [
  { value: "USER", label: "Standard User", description: "Default role for travel enthusiasts, booking stays and guides." },
  { value: "LOCAL_GUIDE", label: "Local Guide", description: "Verified local tour expert role for managing guide profiles." },
  { value: "ADMIN", label: "Platform Administrator", description: "Full control panel permissions, data CRUD, and platform settings." },
];

export default function RoleChangeModal({
  isOpen,
  onClose,
  userDoc = null,
  onSuccess,
}) {
  const [selectedRole, setSelectedRole] = useState("USER");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    if (!isOpen || !userDoc) return;
    setSelectedRole(userDoc.role || "USER");
    setModalError(null);
  }, [isOpen, userDoc]);

  if (!isOpen || !userDoc) return null;

  const currentRole = userDoc.role || "USER";
  const isChangingAdmin = currentRole === "ADMIN" || selectedRole === "ADMIN";
  const isNoChange = currentRole === selectedRole;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNoChange) {
      onClose();
      return;
    }

    setModalError(null);

    try {
      setSubmitting(true);

      const res = await fetch(`/api/admin/users/${userDoc._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess(data.user);
        onClose();
      } else {
        setModalError(data.error || "Failed to update user role.");
      }
    } catch (err) {
      console.error("Role change error:", err);
      setModalError("Network error while trying to update user role.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-borderLine shadow-2xl w-full max-w-md my-8 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-borderLine flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-coral-500 text-white flex items-center justify-center font-bold shadow-md">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white">
                Manage User Access Role
              </h2>
              <p className="text-xs text-slate-400">
                Update account permissions for {userDoc.name}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* ERROR ALERT BANNER */}
          {modalError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0 text-rose-600" />
              <span>{modalError}</span>
            </div>
          )}

          {/* CURRENT vs NEW ROLE SUMMARY */}
          <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">
                Current Role
              </span>
              <Badge variant={currentRole === "ADMIN" ? "coral" : currentRole === "LOCAL_GUIDE" ? "indigo" : "teal"} className="text-[10px]">
                {currentRole}
              </Badge>
            </div>

            <ArrowRight size={18} className="text-slate-400 shrink-0" />

            <div className="space-y-0.5 text-right">
              <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">
                New Role
              </span>
              <Badge variant={selectedRole === "ADMIN" ? "coral" : selectedRole === "LOCAL_GUIDE" ? "indigo" : "teal"} className="text-[10px]">
                {selectedRole}
              </Badge>
            </div>
          </div>

          {/* ROLE SELECTOR OPTIONS */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-primaryText block">Select New Access Level:</label>
            
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedRole === r.value
                    ? "border-coral-500 bg-coral-50/50 shadow-sm"
                    : "border-borderLine bg-white hover:bg-secondaryBg"
                }`}
              >
                <input
                  type="radio"
                  name="userRole"
                  value={r.value}
                  checked={selectedRole === r.value}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-0.5 text-coral-500 focus:ring-coral-500"
                />
                <div>
                  <span className="font-bold text-xs text-primaryText block flex items-center gap-1.5">
                    {r.label}
                    {r.value === "ADMIN" && <ShieldCheck size={13} className="text-coral-500" />}
                  </span>
                  <span className="text-[11px] text-mutedText block leading-relaxed mt-0.5">
                    {r.description}
                  </span>
                </div>
              </label>
            ))}
          </div>

          {/* ADMIN PERMISSION WARNING NOTICE */}
          {isChangingAdmin && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span className="text-[11px] leading-relaxed">
                <strong>Administrator Access Warning:</strong> Changing administrator access affects platform control permissions and system capabilities.
              </span>
            </div>
          )}

        </form>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-borderLine bg-secondaryBg flex items-center justify-end gap-3">
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
            disabled={submitting || isNoChange}
            onClick={handleSubmit}
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Role...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Confirm Role Change</span>
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}

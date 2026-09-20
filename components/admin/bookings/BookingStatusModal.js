"use client";

import React, { useState } from "react";
import { X, CalendarCheck, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const ALLOWED_TRANSITIONS = {
  PENDING: [
    { value: "CONFIRMED", label: "Confirm Booking (PENDING → CONFIRMED)", variant: "teal" },
    { value: "CANCELLED", label: "Cancel Booking (PENDING → CANCELLED)", variant: "rose" },
  ],
  CONFIRMED: [
    { value: "COMPLETED", label: "Mark as Completed (CONFIRMED → COMPLETED)", variant: "purple" },
    { value: "CANCELLED", label: "Cancel Booking (CONFIRMED → CANCELLED)", variant: "rose" },
  ],
  CANCELLED: [],
  COMPLETED: [],
};

export default function BookingStatusModal({ booking, isOpen, onClose, onSuccess }) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen || !booking) return null;

  const currentStatus = booking.status || "PENDING";
  const transitionOptions = ALLOWED_TRANSITIONS[currentStatus] || [];
  const isTerminal = transitionOptions.length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) {
      setError("Please select a new status option.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/admin/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update booking status.");
      }

      setSuccessMsg(`Booking status updated to ${selectedStatus} successfully.`);
      setTimeout(() => {
        onSuccess(data.booking);
        onClose();
        setSelectedStatus("");
        setSuccessMsg("");
      }, 800);
    } catch (err) {
      setError(err.message || "An error occurred while updating status.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="teal">CONFIRMED</Badge>;
      case "COMPLETED":
        return <Badge variant="purple">COMPLETED</Badge>;
      case "CANCELLED":
        return <Badge variant="rose">CANCELLED</Badge>;
      case "PENDING":
      default:
        return <Badge variant="amber">PENDING</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-borderLine shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-borderLine bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-coral-500/20 text-coral-400 flex items-center justify-center font-bold">
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Update Booking Status
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {booking._id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Messages */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2.5">
              <CheckCircle size={16} className="shrink-0 text-teal-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Status Box */}
          <div className="p-4 rounded-2xl bg-secondaryBg border border-borderLine flex items-center justify-between">
            <span className="text-xs font-semibold text-mutedText">Current Status</span>
            <div>{getStatusBadge(currentStatus)}</div>
          </div>

          {/* Terminal State Warning */}
          {isTerminal ? (
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs space-y-1">
              <span className="font-bold block text-slate-800">Terminal Status Lock</span>
              <p className="leading-relaxed">
                Bookings with status <strong className="font-semibold uppercase">{currentStatus}</strong> cannot be changed further. Historical record is locked for audit integrity.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-xs font-bold text-primaryText block uppercase tracking-wider">
                Select New Status
              </label>
              
              <div className="space-y-2">
                {transitionOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedStatus === opt.value
                        ? "border-coral-500 bg-coral-50/50 shadow-sm"
                        : "border-borderLine bg-white hover:bg-secondaryBg"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="bookingStatus"
                        value={opt.value}
                        checked={selectedStatus === opt.value}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-4 h-4 text-coral-500 border-borderLine focus:ring-coral-500"
                      />
                      <span className="text-xs font-semibold text-primaryText">
                        {opt.label}
                      </span>
                    </div>
                    <Badge variant={opt.variant} className="text-[10px]">
                      {opt.value}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation Notice for Admin */}
          {!isTerminal && selectedStatus && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600" />
              <span>
                Status update will be reflected in user dashboard. Financial totals will remain untouched.
              </span>
            </div>
          )}

          {/* MODAL ACTIONS */}
          <div className="pt-3 border-t border-borderLine flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={onClose} type="button" disabled={loading}>
              Cancel
            </Button>

            {!isTerminal && (
              <Button
                variant="primary"
                type="submit"
                disabled={loading || !selectedStatus}
                loading={loading}
              >
                Confirm Transition
              </Button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
}

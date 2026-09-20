"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  User,
  Mail,
  Phone,
  Globe,
  DollarSign,
  CalendarCheck,
  Star,
  MessageSquare,
  ShieldCheck,
  Clock,
  Loader2,
  AlertCircle,
  Building2,
  Compass,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function UserDetailModal({ isOpen, onClose, userDoc }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !userDoc?._id) return;

    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/admin/users/${userDoc._id}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setDetails(data);
        } else {
          setError(data.error || "Failed to load user details.");
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError("Network error loading user details.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [isOpen, userDoc]);

  if (!isOpen || !userDoc) return null;

  const user = details?.user || userDoc;
  const stats = details?.stats || { bookingCount: 0, reviewCount: 0, aiChatCount: 0 };

  const getRoleBadgeVariant = (role) => {
    if (role === "ADMIN") return "coral";
    if (role === "LOCAL_GUIDE") return "indigo";
    return "teal";
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-borderLine shadow-2xl w-full max-w-xl my-8 overflow-hidden animate-in zoom-in-95 duration-200 space-y-0">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-borderLine flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <User size={22} />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white">
                User Account Overview
              </h2>
              <p className="text-xs text-slate-400">
                Detailed profile & platform activity metrics
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

        {/* MODAL BODY */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-coral-500 mx-auto" />
              <p className="text-xs font-semibold text-mutedText">Loading user profile and metrics...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
              <AlertCircle size={28} className="text-rose-500 mx-auto" />
              <p className="text-xs font-semibold text-rose-700">{error}</p>
            </div>
          ) : (
            <>
              {/* USER HERO BANNER */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-3xl bg-secondaryBg border border-borderLine">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 shrink-0 border border-borderLine flex items-center justify-center">
                  {user.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt={user.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User size={36} className="text-slate-400" />
                  )}
                </div>

                <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                    <h3 className="font-display font-extrabold text-xl text-primaryText truncate">
                      {user.name}
                    </h3>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="self-center sm:self-auto text-[10px] py-0.5 px-2.5">
                      {user.role}
                    </Badge>
                  </div>

                  <p className="text-xs text-mutedText flex items-center justify-center sm:justify-start gap-1 truncate">
                    <Mail size={13} className="shrink-0" />
                    <span>{user.email}</span>
                  </p>

                  <span className="text-[11px] text-bodyText block pt-0.5 font-medium">
                    Joined: {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>

              {/* ACCOUNT DETAILS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
                  <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">
                    Phone Number
                  </span>
                  <p className="text-xs font-semibold text-primaryText flex items-center gap-1.5">
                    <Phone size={14} className="text-coral-500 shrink-0" />
                    <span>{user.phone || "Not specified"}</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
                  <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">
                    Country of Residence
                  </span>
                  <p className="text-xs font-semibold text-primaryText flex items-center gap-1.5">
                    <Globe size={14} className="text-teal-600 shrink-0" />
                    <span>{user.country || "India"}</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
                  <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">
                    Preferred Currency
                  </span>
                  <p className="text-xs font-semibold text-primaryText flex items-center gap-1.5">
                    <DollarSign size={14} className="text-amber-500 shrink-0" />
                    <span>{user.preferredCurrency || "INR"}</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1">
                  <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block">
                    Account Security
                  </span>
                  <p className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="shrink-0 text-teal-600" />
                    <span>Encrypted bcrypt Password</span>
                  </p>
                </div>
              </div>

              {/* ACTIVITY METRICS CARDS */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-coral-500 border-b border-borderLine pb-2">
                  Platform Activity History
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  
                  {/* Bookings Count */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-0.5">
                    <CalendarCheck size={18} className="text-emerald-600 mx-auto" />
                    <span className="font-display font-extrabold text-lg text-emerald-900 block">
                      {stats.bookingCount}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 block">
                      Bookings
                    </span>
                  </div>

                  {/* Reviews Count */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-0.5">
                    <Star size={18} className="text-amber-500 mx-auto" />
                    <span className="font-display font-extrabold text-lg text-amber-900 block">
                      {stats.reviewCount}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-700 block">
                      Reviews
                    </span>
                  </div>

                  {/* AI Chats Count */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-center space-y-0.5">
                    <MessageSquare size={18} className="text-indigo-600 mx-auto" />
                    <span className="font-display font-extrabold text-lg text-indigo-900 block">
                      {stats.aiChatCount}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-700 block">
                      AI Chats
                    </span>
                  </div>

                </div>
              </div>
            </>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-borderLine bg-secondaryBg flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

      </div>
    </div>
  );
}

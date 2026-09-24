"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  MapPin,
  Hotel,
  Users,
  FileCheck,
  CalendarCheck,
  Star,
  UserRound,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const sidebarNavItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Destinations", href: "/admin/destinations", icon: MapPin },
  { name: "Hotels", href: "/admin/hotels", icon: Hotel },
  { name: "Guides", href: "/admin/guides", icon: Users },
  { name: "Guide Applications", href: "/admin/guide-applications", icon: FileCheck, badgeKey: "pendingApplications" },
  { name: "Users", href: "/admin/users", icon: UserRound },
  { name: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
];

export default function AdminClientLayout({ user, children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    async function fetchPendingStats() {
      try {
        const res = await fetch("/api/admin/guide-applications?status=PENDING&limit=1");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.stats) {
            setPendingCount(json.stats.pending || 0);
          }
        }
      } catch (err) {
        console.error("Failed to fetch pending applications count for sidebar:", err);
      }
    }
    fetchPendingStats();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/sign-in");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-secondaryBg flex flex-col font-sans">
      
      {/* TOP ADMIN HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle sidebar"
            >
              {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shrink-0 border border-slate-700 bg-white">
                <Image
                  src="/logo.png"
                  alt="Travellow Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              <div>
                <span className="font-display font-extrabold text-lg text-white tracking-tight block leading-tight">
                  Travellow Admin
                </span>
                <span className="text-[10px] text-coral-400 font-semibold uppercase tracking-widest block -mt-0.5">
                  Platform Control Panel
                </span>
              </div>
            </Link>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-slate-800">
              <div className="text-right">
                <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
                  <span>{user.name}</span>
                  <Badge variant="coral" className="text-[10px] py-0 px-1.5 uppercase">
                    ADMIN
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-400 block">{user.email}</span>
              </div>
            </div>

            {/* View Website Link */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
            >
              <span>View Website</span>
              <ExternalLink size={13} />
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* BODY SHELL WITH SIDEBAR AND MAIN CONTENT */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block w-64 bg-white border-r border-borderLine py-6 px-4 space-y-6 shrink-0 min-h-[calc(100vh-4rem)]">
          <div className="px-3">
            <span className="text-[10px] uppercase font-bold text-mutedText tracking-widest block">
              Navigation Menu
            </span>
          </div>

          <nav className="space-y-1">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-coral-500 text-white shadow-md shadow-coral-500/20"
                      : "text-bodyText hover:bg-secondaryBg hover:text-primaryText"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </div>
                  {item.badgeKey === "pendingApplications" && pendingCount > 0 && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive ? "bg-white text-coral-600" : "bg-amber-100 text-amber-700"
                    }`}>
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-borderLine px-3 space-y-2">
            <div className="p-3 rounded-2xl bg-secondaryBg border border-borderLine space-y-1">
              <div className="flex items-center gap-1 text-[11px] font-bold text-primaryText">
                <ShieldCheck size={14} className="text-teal-600" />
                <span>Admin Privileges</span>
              </div>
              <p className="text-[10px] text-mutedText leading-relaxed">
                Server-side HTTP-only session authenticated as Platform Administrator.
              </p>
            </div>
          </div>
        </aside>

        {/* MOBILE SIDEBAR DRAWER */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex">
            <div className="w-64 bg-white h-full p-5 space-y-6 shadow-2xl flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-borderLine">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg overflow-hidden shadow border border-slate-200 bg-white shrink-0">
                      <Image
                        src="/logo.png"
                        alt="Travellow Logo"
                        width={28}
                        height={28}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="font-bold text-sm text-primaryText">Admin Menu</span>
                  </div>
                  <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400">
                    <X size={18} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {sidebarNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileSidebarOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-bodyText hover:bg-secondaryBg hover:text-primaryText"
                      >
                        <Icon size={16} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-borderLine">
                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-semibold text-xs border border-rose-200"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
          </div>
        )}

        {/* MAIN ADMIN PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
          {children}
        </main>

      </div>
    </div>
  );
}

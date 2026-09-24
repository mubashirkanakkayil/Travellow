"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Menu, X, Sparkles, User, LogIn, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Destinations", href: "/destinations" },
  { name: "Hotels", href: "/hotels" },
  { name: "Local Guides", href: "/guides" },
  { name: "AI Trip Planner", href: "/trip-planner", isAi: true },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch current user authentication status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        setLoadingAuth(true);
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated) {
          setAuthUser(data.user);
        } else {
          setAuthUser(null);
        }
      } catch (err) {
        setAuthUser(null);
      } finally {
        setLoadingAuth(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setAuthUser(null);
      router.push("/sign-in");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Suppress public Navbar on all Admin pages (placed after all hooks)
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-borderLine py-3.5"
          : "bg-white/80 backdrop-blur-sm border-b border-borderLine/50 py-4"
      }`}
    >
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-coral-500/20 group-hover:scale-105 transition-transform shrink-0 border border-coral-200/80 bg-white">
              <Image
                src="/logo.png"
                alt="Travellow Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl text-primaryText tracking-tight">
                Travellow
              </span>
              <span className="text-[10px] font-medium text-coral-500 uppercase tracking-widest -mt-1">
                AI Travel Guide
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "bg-coral-100 text-coral-600 font-semibold"
                      : "text-bodyText hover:text-primaryText hover:bg-secondaryBg"
                  }`}
                >
                  {link.isAi && <Sparkles size={14} className="text-coral-500 animate-pulse" />}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {loadingAuth ? (
              <div className="w-24 h-9 rounded-full bg-secondaryBg animate-pulse" />
            ) : authUser ? (
              <>
                {authUser.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="softCoral" size="sm">
                      <ShieldCheck size={16} />
                      Admin Panel
                    </Button>
                  </Link>
                )}
                {authUser.role === "LOCAL_GUIDE" && (
                  <Link href="/dashboard">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                      <ShieldCheck size={14} />
                      Local Guide
                    </span>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="secondary" size="sm">
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">
                    <LogIn size={16} />
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button variant="primary" size="sm">
                    <User size={16} />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-primaryText hover:bg-secondaryBg border border-borderLine focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-borderLine bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-1 pt-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? "bg-coral-100 text-coral-600 font-semibold"
                      : "text-bodyText hover:bg-secondaryBg hover:text-primaryText"
                  }`}
                >
                  {link.isAi && <Sparkles size={16} className="text-coral-500" />}
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-borderLine flex flex-col gap-2.5">
            {authUser ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="md" className="w-full justify-center">
                    <LayoutDashboard size={18} />
                    Dashboard ({authUser.name.split(" ")[0]})
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut size={18} />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="md" className="w-full justify-center">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full justify-center">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

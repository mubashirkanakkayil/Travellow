"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  UserRound,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  UserCheck,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Globe,
  DollarSign,
  Calendar,
  X,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import UserDetailModal from "@/components/admin/users/UserDetailModal";
import RoleChangeModal from "@/components/admin/users/RoleChangeModal";

function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roleCounts, setRoleCounts] = useState({
    total: 0,
    userCount: 0,
    guideCount: 0,
    adminCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  // Modal states
  const [viewingUser, setViewingUser] = useState(null);
  const [roleEditingUser, setRoleEditingUser] = useState(null);

  // Success alert toast state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch user accounts from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (selectedRole !== "ALL") params.append("role", selectedRole);
      if (sortBy) params.append("sort", sortBy);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setUsers(data.users || []);
        if (data.roleCounts) {
          setRoleCounts(data.roleCounts);
        }
      } else {
        setError(data.error || "Failed to load user accounts.");
      }
    } catch (err) {
      console.error("Error fetching admin users:", err);
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedRole, sortBy]);

  const handleRoleSuccess = (updatedUser) => {
    showToast(`Role for "${updatedUser.name}" changed to ${updatedUser.role} successfully!`);
    fetchUsers();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRole("ALL");
    setSortBy("newest");
  };

  const getRoleBadgeVariant = (role) => {
    if (role === "ADMIN") return "coral";
    if (role === "LOCAL_GUIDE") return "indigo";
    return "teal";
  };

  return (
    <div className="space-y-6">
      
      {/* TOAST SUCCESS ALERT */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-borderLine shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-coral-500 uppercase tracking-widest">
            <UserRound size={16} />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-primaryText tracking-tight">
            User Accounts & Role Management
          </h1>
          <p className="text-xs sm:text-sm text-bodyText">
            Manage Travellow user accounts and access roles with server-side safeguards.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchUsers} title="Refresh">
          <RefreshCw size={14} className={loading ? "animate-spin text-coral-500" : ""} />
          <span>Refresh List</span>
        </Button>
      </div>

      {/* USER STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Total Users */}
        <div className="bg-white p-4.5 rounded-2xl border border-borderLine shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">
              Total Users
            </span>
            <span className="font-display font-extrabold text-2xl text-primaryText block">
              {roleCounts.total}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <UserRound size={20} />
          </div>
        </div>

        {/* Standard Users */}
        <div className="bg-white p-4.5 rounded-2xl border border-borderLine shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">
              Travelers
            </span>
            <span className="font-display font-extrabold text-2xl text-teal-600 block">
              {roleCounts.userCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
        </div>

        {/* Local Guides */}
        <div className="bg-white p-4.5 rounded-2xl border border-borderLine shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">
              Local Guides
            </span>
            <span className="font-display font-extrabold text-2xl text-indigo-600 block">
              {roleCounts.guideCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
        </div>

        {/* Platform Admins */}
        <div className="bg-white p-4.5 rounded-2xl border border-borderLine shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-mutedText uppercase tracking-wider block">
              Admins
            </span>
            <span className="font-display font-extrabold text-2xl text-coral-600 block">
              {roleCounts.adminCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-coral-50 text-coral-500 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
        </div>

      </div>

      {/* TOOLBAR: SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-borderLine shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-wrap">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-3 text-mutedText" />
            <input
              type="text"
              placeholder="Search users by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondaryBg border border-borderLine text-xs text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50"
            />
          </div>

          {/* Role Dropdown Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-mutedText font-semibold flex items-center gap-1 shrink-0">
              <Filter size={14} /> Role:
            </span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 rounded-xl bg-secondaryBg border border-borderLine text-xs font-semibold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50 w-full sm:w-auto"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">Standard User (USER)</option>
              <option value="LOCAL_GUIDE">Local Guide (LOCAL_GUIDE)</option>
              <option value="ADMIN">Platform Admin (ADMIN)</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-mutedText font-semibold shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-secondaryBg border border-borderLine text-xs font-semibold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500/50 w-full sm:w-auto"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="role">Role</option>
            </select>
          </div>

        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <span className="text-xs text-mutedText font-medium">
            Found: <strong>{users.length}</strong> items
          </span>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear Filters
          </Button>
        </div>

      </div>

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="p-8 rounded-3xl bg-white border border-rose-200 text-center space-y-3 shadow-sm">
          <AlertCircle size={32} className="text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-primaryText">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchUsers}>
            Try Again
          </Button>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && (
        <div className="bg-white p-6 rounded-3xl border border-borderLine shadow-sm space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && users.length === 0 && (
        <div className="p-12 bg-white rounded-3xl border border-borderLine text-center space-y-4 shadow-sm">
          <UserRound size={40} className="mx-auto text-teal-600" />
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-primaryText">No Users Found</h3>
            <p className="text-xs text-mutedText max-w-sm mx-auto">
              No user accounts matched your search parameters or role filters.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* RESPONSIVE TABLE & LIST VIEW */}
      {!loading && !error && users.length > 0 && (
        <div className="bg-white rounded-3xl border border-borderLine shadow-sm overflow-hidden">
          
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondaryBg/80 text-mutedText text-[11px] font-bold uppercase tracking-wider border-b border-borderLine">
                  <th className="py-4 px-6">User Profile</th>
                  <th className="py-4 px-4">Email Address</th>
                  <th className="py-4 px-4">Role</th>
                  <th className="py-4 px-4">Country & Currency</th>
                  <th className="py-4 px-4">Joined Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLine text-xs font-medium text-primaryText">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-secondaryBg/40 transition-colors">
                    
                    {/* User Profile Avatar & Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-borderLine flex items-center justify-center">
                          {u.profileImage ? (
                            <Image
                              src={u.profileImage}
                              alt={u.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <UserRound size={20} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-primaryText flex items-center gap-1.5">
                            <span>{u.name}</span>
                          </div>
                          <span className="text-[11px] text-mutedText block font-mono">
                            {u._id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-4 font-mono text-xs">
                      {u.email}
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      <Badge variant={getRoleBadgeVariant(u.role)} className="text-[10px] py-0.5 px-2">
                        {u.role}
                      </Badge>
                    </td>

                    {/* Country & Preferred Currency */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold block text-primaryText">{u.country || "India"}</span>
                        <span className="text-[10px] text-mutedText block uppercase">
                          {u.preferredCurrency || "INR"}
                        </span>
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-4 text-xs text-mutedText">
                      {formatDate(u.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingUser(u)}
                          className="h-8 px-2.5 text-xs gap-1"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRoleEditingUser(u)}
                          className="h-8 px-2.5 text-xs text-coral-600 hover:bg-coral-50"
                        >
                          <ShieldCheck size={13} />
                          <span>Manage Role</span>
                        </Button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD LIST */}
          <div className="md:hidden divide-y divide-borderLine">
            {users.map((u) => (
              <div key={u._id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-borderLine flex items-center justify-center">
                    {u.profileImage ? (
                      <Image src={u.profileImage} alt={u.name} fill className="object-cover" />
                    ) : (
                      <UserRound size={20} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-primaryText truncate">{u.name}</h4>
                      <Badge variant={getRoleBadgeVariant(u.role)} className="text-[9px]">{u.role}</Badge>
                    </div>
                    <span className="text-xs text-mutedText block truncate">{u.email}</span>
                    <span className="text-[11px] text-bodyText block mt-0.5">
                      {u.country || "India"} • Joined {formatDate(u.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-borderLine/50">
                  <Button variant="outline" size="sm" onClick={() => setViewingUser(u)} className="h-7 text-[11px] px-2.5">
                    <Eye size={12} /> View Details
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setRoleEditingUser(u)} className="h-7 text-[11px] px-2.5 text-coral-600">
                    <ShieldCheck size={12} /> Manage Role
                  </Button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* USER DETAIL MODAL */}
      <UserDetailModal
        isOpen={Boolean(viewingUser)}
        onClose={() => setViewingUser(null)}
        userDoc={viewingUser}
      />

      {/* ROLE CHANGE MODAL */}
      <RoleChangeModal
        isOpen={Boolean(roleEditingUser)}
        onClose={() => setRoleEditingUser(null)}
        userDoc={roleEditingUser}
        onSuccess={handleRoleSuccess}
      />

    </div>
  );
}

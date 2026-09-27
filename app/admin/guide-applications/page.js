"use client";

import React, { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import GuideApplicationDetailModal from "@/components/admin/guide-applications/GuideApplicationDetailModal";
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  User,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AdminGuideApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [destinationFilter, setDestinationFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch destinations for filter dropdown
  useEffect(() => {
    async function loadDestinations() {
      try {
        const res = await fetch("/api/destinations");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDestinations(json.data);
        }
      } catch (err) {
        console.error("Failed to load destinations for admin filter:", err);
      }
    }
    loadDestinations();
  }, []);

  // Fetch applications list with filters
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "15",
        sort,
      });

      if (search.trim()) queryParams.set("search", search.trim());
      if (statusFilter !== "ALL") queryParams.set("status", statusFilter);
      if (destinationFilter !== "ALL") queryParams.set("destination", destinationFilter);

      const res = await fetch(`/api/admin/guide-applications?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success) {
        setApplications(data.data || []);
        setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch admin guide applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, statusFilter, destinationFilter, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const handleModalClose = () => {
    setSelectedApplication(null);
  };

  const handleActionComplete = () => {
    setSelectedApplication(null);
    fetchApplications();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="success">APPROVED</Badge>;
      case "REJECTED":
        return <Badge variant="coral">REJECTED</Badge>;
      case "PENDING":
      default:
        return <Badge variant="warning">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="text-coral-500" size={24} />
            <h1 className="font-display font-extrabold text-2xl text-primaryText">
              Guide Applications
            </h1>
          </div>
          <p className="text-bodyText text-xs sm:text-sm mt-1">
            Review and approve user applications for Local Guide certification.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchApplications}
          className="shrink-0 flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-borderLine space-y-1 shadow-sm">
          <span className="text-xs font-semibold text-mutedText uppercase">Total Applications</span>
          <p className="text-2xl font-bold text-primaryText">{stats.total}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1">
            <Clock size={12} /> Pending Review
          </span>
          <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1">
            <CheckCircle2 size={12} /> Approved Guides
          </span>
          <p className="text-2xl font-bold text-emerald-900">{stats.approved}</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1">
            <XCircle size={12} /> Rejected
          </span>
          <p className="text-2xl font-bold text-rose-900">{stats.rejected}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 rounded-2xl bg-white border border-borderLine space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search */}
          <div className="sm:col-span-4 relative">
            <Input
              type="text"
              placeholder="Search applicant name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
              className="w-full text-xs"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-secondaryBg border border-borderLine rounded-xl text-xs font-semibold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="PENDING">Status: Pending Only</option>
              <option value="APPROVED">Status: Approved Only</option>
              <option value="REJECTED">Status: Rejected Only</option>
            </select>
          </div>

          {/* Destination Filter */}
          <div className="sm:col-span-3">
            <select
              value={destinationFilter}
              onChange={(e) => {
                setDestinationFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-secondaryBg border border-borderLine rounded-xl text-xs font-semibold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500"
            >
              <option value="ALL">Destination: All Destinations</option>
              {destinations.map((dest) => (
                <option key={dest._id} value={dest._id}>
                  {dest.name} ({dest.country})
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="sm:col-span-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-3 py-2.5 bg-secondaryBg border border-borderLine rounded-xl text-xs font-semibold text-primaryText focus:outline-none focus:ring-2 focus:ring-coral-500"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name">Sort: Name A-Z</option>
            </select>
          </div>

        </form>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-3xl border border-borderLine shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-bodyText">
          <thead className="bg-secondaryBg border-b border-borderLine text-[11px] uppercase font-bold text-mutedText tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Applicant</th>
              <th className="py-3.5 px-4">Destination</th>
              <th className="py-3.5 px-4">Experience</th>
              <th className="py-3.5 px-4">Hourly Rate</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Submitted</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderLine">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-mutedText">
                  <div className="w-6 h-6 border-2 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading guide applications...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-mutedText">
                  No guide applications found matching filters.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-borderLine">
                        {app.profileImage ? (
                          <img
                            src={app.profileImage}
                            alt={app.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User size={16} />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-primaryText block">{app.fullName}</span>
                        <span className="text-[11px] text-mutedText block">{app.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-primaryText">
                    {app.destination?.name || "Target Destination"}
                  </td>
                  <td className="py-3.5 px-4 font-medium">
                    {app.experienceYears} Years
                  </td>
                  <td className="py-3.5 px-4 font-bold text-primaryText">
                    {app.currency} {app.hourlyRate}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(app.status)}
                  </td>
                  <td className="py-3.5 px-4 text-mutedText">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApplication(app)}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Eye size={14} />
                      View Details
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="py-12 text-center text-mutedText bg-white rounded-3xl border border-borderLine">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="py-12 text-center text-mutedText bg-white rounded-3xl border border-borderLine">
            No guide applications found matching filters.
          </div>
        ) : (
          applications.map((app) => (
            <Card key={app._id} className="p-4 space-y-3 border border-borderLine rounded-2xl bg-white">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-borderLine">
                    {app.profileImage ? (
                      <img
                        src={app.profileImage}
                        alt={app.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-primaryText block">{app.fullName}</span>
                    <span className="text-xs text-mutedText block">{app.email}</span>
                  </div>
                </div>
                {getStatusBadge(app.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-mutedText block">Destination</span>
                  <span className="font-semibold text-primaryText">{app.destination?.name}</span>
                </div>
                <div>
                  <span className="text-mutedText block">Rate & Exp</span>
                  <span className="font-semibold text-primaryText">
                    {app.currency} {app.hourlyRate} • {app.experienceYears} yrs
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-mutedText">
                  Submitted: {new Date(app.createdAt).toLocaleDateString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedApplication(app)}
                  className="flex items-center gap-1.5"
                >
                  <Eye size={14} />
                  View Details
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-borderLine text-xs">
          <span className="text-mutedText">
            Page <span className="font-bold text-primaryText">{page}</span> of{" "}
            <span className="font-bold text-primaryText">{totalPages}</span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Detail & Review Modal */}
      {selectedApplication && (
        <GuideApplicationDetailModal
          application={selectedApplication}
          onClose={handleModalClose}
          onActionComplete={handleActionComplete}
        />
      )}

    </div>
  );
}

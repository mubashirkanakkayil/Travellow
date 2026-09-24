import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import GuideApplication from "@/models/GuideApplication";
import User from "@/models/User";
import Destination from "@/models/Destination";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/guide-applications
 * Retrieve guide applications list with search, filtering, and stats breakdown for admin panel.
 * ADMIN ONLY.
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const destination = searchParams.get("destination");
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "50", 10));

    const query = {};

    // Status filter (PENDING, APPROVED, REJECTED)
    if (status && status !== "ALL") {
      const upperStatus = status.toUpperCase().trim();
      if (["PENDING", "APPROVED", "REJECTED"].includes(upperStatus)) {
        query.status = upperStatus;
      }
    }

    // Destination filter
    if (destination && destination !== "ALL") {
      query.destination = destination;
    }

    // Search query across fullName, email, country
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { country: searchRegex },
      ];
    }

    // Sort options
    let sortOptions = { createdAt: -1 };
    if (sort === "oldest") sortOptions = { createdAt: 1 };
    if (sort === "name") sortOptions = { fullName: 1 };

    // Parallel count queries for stats
    const [
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      filteredTotal,
    ] = await Promise.all([
      GuideApplication.countDocuments(),
      GuideApplication.countDocuments({ status: "PENDING" }),
      GuideApplication.countDocuments({ status: "APPROVED" }),
      GuideApplication.countDocuments({ status: "REJECTED" }),
      GuideApplication.countDocuments(query),
    ]);

    const skip = (page - 1) * limit;

    const applications = await GuideApplication.find(query)
      .populate("user", "name email role country profileImage")
      .populate("destination", "name country image slug")
      .populate("reviewedBy", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      count: applications.length,
      total: filteredTotal,
      page,
      totalPages: Math.ceil(filteredTotal / limit) || 1,
      stats: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      data: applications,
    });
  } catch (error) {
    console.error("GET /api/admin/guide-applications Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin guide applications." },
      { status: 500 }
    );
  }
}

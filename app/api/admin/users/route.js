import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import User from "@/models/User";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users
 * Retrieve users list and role breakdown counts for admin panel.
 * Supports: search (name, email), role filter (USER, LOCAL_GUIDE, ADMIN), sort, pagination.
 * Password field is strictly excluded (-password).
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
    const role = searchParams.get("role");
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "50", 10));

    const query = {};

    // Role filter
    if (role && role !== "ALL") {
      const upperRole = role.toUpperCase().trim();
      if (["USER", "ADMIN", "LOCAL_GUIDE"].includes(upperRole)) {
        query.role = upperRole;
      }
    }

    // Search query across name and email
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    // Sort options
    let sortOptions = { createdAt: -1 };
    if (sort === "oldest") sortOptions = { createdAt: 1 };
    if (sort === "name") sortOptions = { name: 1 };
    if (sort === "role") sortOptions = { role: 1 };

    // Calculate real MongoDB role counts in parallel
    const [
      totalUsersCount,
      standardUsersCount,
      localGuidesCount,
      adminsCount,
      filteredTotal,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "USER" }),
      User.countDocuments({ role: "LOCAL_GUIDE" }),
      User.countDocuments({ role: "ADMIN" }),
      User.countDocuments(query),
    ]);

    const skip = (page - 1) * limit;

    // Fetch user records excluding password field
    const users = await User.find(query)
      .select("-password")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedUsers = users.map((u) => ({
      ...u,
      _id: u._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      count: formattedUsers.length,
      total: filteredTotal,
      page,
      totalPages: Math.ceil(filteredTotal / limit) || 1,
      roleCounts: {
        total: totalUsersCount,
        userCount: standardUsersCount,
        guideCount: localGuidesCount,
        adminCount: adminsCount,
      },
      users: formattedUsers,
    });
  } catch (error) {
    console.error("GET /api/admin/users Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users.", details: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import GuideApplication from "@/models/GuideApplication";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const applications = await GuideApplication.find({ user: user.id })
      .sort({ createdAt: -1 })
      .populate("destination", "name country image slug")
      .lean();

    return NextResponse.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error("GET /api/guide-applications/me Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch guide applications." },
      { status: 500 }
    );
  }
}

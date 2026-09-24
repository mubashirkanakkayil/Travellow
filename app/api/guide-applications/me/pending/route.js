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

    const pendingApplication = await GuideApplication.findOne({
      user: user.id,
      status: "PENDING",
    })
      .populate("destination", "name country image slug")
      .lean();

    return NextResponse.json({
      success: true,
      data: pendingApplication || null,
      hasPending: Boolean(pendingApplication),
    });
  } catch (error) {
    console.error("GET /api/guide-applications/me/pending Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pending guide application." },
      { status: 500 }
    );
  }
}

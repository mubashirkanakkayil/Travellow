import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("POST /api/auth/logout Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to log out." },
      { status: 500 }
    );
  }
}

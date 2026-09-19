import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        country: user.country,
        preferredCurrency: user.preferredCurrency,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me Error:", error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

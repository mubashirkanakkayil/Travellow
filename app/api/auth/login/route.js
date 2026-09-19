import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/models/User";
import { comparePassword, setSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    // 2. Connect DB
    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 4. Compare password with bcryptjs
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 5. Create session & set HTTP-only cookie
    await setSessionCookie(user);

    // 6. Return safe user data (NO password)
    return NextResponse.json({
      success: true,
      message: "Signed in successfully.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "",
        country: user.country || "India",
        preferredCurrency: user.preferredCurrency || "INR",
      },
    });
  } catch (error) {
    console.error("POST /api/auth/login Error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during authentication." },
      { status: 500 }
    );
  }
}

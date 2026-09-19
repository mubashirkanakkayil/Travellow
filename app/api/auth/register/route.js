import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/models/User";
import { hashPassword, setSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const ALLOWED_CURRENCIES = ["INR", "USD", "AED", "EUR", "GBP", "JPY"];

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, country, preferredCurrency } = body;

    // 1. Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long.",
        },
        { status: 400 }
      );
    }

    const currency = ALLOWED_CURRENCIES.includes(preferredCurrency)
      ? preferredCurrency
      : "INR";

    // 2. Connect DB
    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email address already exists.",
        },
        { status: 409 }
      );
    }

    // 4. Hash password
    const hashedPassword = await hashPassword(password);

    // 5. Create user (Public registration ALWAYS sets role: "USER")
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : "",
      country: country ? country.trim() : "India",
      preferredCurrency: currency,
      role: "USER",
    });

    // 6. Set HTTP-only session cookie
    const sessionUser = await setSessionCookie(newUser);

    // 7. Return safe user info (NO password)
    return NextResponse.json(
      {
        success: true,
        message: "Account registered successfully.",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          country: newUser.country,
          preferredCurrency: newUser.preferredCurrency,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/auth/register Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to register account. Please try again.",
      },
      { status: 500 }
    );
  }
}

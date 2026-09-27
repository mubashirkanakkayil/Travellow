import { cache } from "react";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../db/connect.js";
import User from "../../models/User.js";

const COOKIE_NAME = "travellow_session";
const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "travellow_super_secret_session_key_2026";
const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

async function getCookieStore() {
  try {
    const nextHeaders = await import("next/headers");
    return nextHeaders.cookies();
  } catch (err) {
    return null;
  }
}

/**
 * Hash a plain text password using bcryptjs
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare a plain text password with a stored hash using bcryptjs
 */
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically signed session token string
 */
export function createToken(payload) {
  const expiresAt = Math.floor(Date.now() / 1000) + SEVEN_DAYS_IN_SECONDS;
  const tokenData = JSON.stringify({ ...payload, exp: expiresAt });
  const base64Data = Buffer.from(tokenData).toString("base64url");

  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(base64Data)
    .digest("base64url");

  return `${base64Data}.${signature}`;
}

/**
 * Verify and decode a cryptographically signed session token
 */
export function verifyToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [base64Data, signature] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(base64Data)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedSigBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)
  ) {
    return null;
  }

  try {
    const jsonString = Buffer.from(base64Data, "base64url").toString("utf-8");
    const data = JSON.parse(jsonString);

    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return data;
  } catch (err) {
    return null;
  }
}

/**
 * Set the HTTP-only session cookie in response headers
 */
export async function setSessionCookie(user) {
  const payload = {
    id: user._id ? user._id.toString() : user.id,
    email: user.email,
    name: user.name,
    role: user.role || "USER",
    country: user.country || "India",
    preferredCurrency: user.preferredCurrency || "INR",
  };

  const token = createToken(payload);
  const cookieStore = await getCookieStore();

  if (cookieStore) {
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SEVEN_DAYS_IN_SECONDS,
      path: "/",
    });
  }

  return payload;
}

/**
 * Clear the HTTP-only session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await getCookieStore();
  if (cookieStore) {
    cookieStore.delete(COOKIE_NAME);
  }
}

/**
 * Get current session payload from cookies
 */
export async function getSession() {
  try {
    const cookieStore = await getCookieStore();
    if (!cookieStore) return null;

    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const payload = verifyToken(sessionCookie.value);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Get fresh current user document from MongoDB if authenticated
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  const session = await getSession();
  if (!session || !session.id) return null;

  try {
    await connectToDatabase();
    const user = await User.findById(session.id).select("-password").lean();
    if (!user) return null;

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      country: user.country || "India",
      preferredCurrency: user.preferredCurrency || "INR",
      profileImage: user.profileImage || "",
      createdAt: user.createdAt,
    };
  } catch (error) {
    return null;
  }
});

/**
 * Server-side requirement helper for authenticated routes
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Server-side requirement helper for role-restricted routes
 */
export async function requireRole(allowedRoles = []) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

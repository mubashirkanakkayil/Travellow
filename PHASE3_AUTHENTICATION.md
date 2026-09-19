# Travellow Phase 3 — Authentication Architecture & Documentation

This document provides a beginner-friendly, technical overview of the authentication system implemented for **Travellow**. It is structured specifically for MCA student project reviews, demonstrations, and viva examinations.

---

## 1. Architecture Flow Diagram

```text
User / Browser (Form Submission)
         ↓
Next.js App Router API Route (/api/auth/register or /api/auth/login)
         ↓
MongoDB Atlas User Collection (models/User.js)
         ↓
bcryptjs Password Hashing / Comparison
         ↓
HTTP-only Session Cookie (travellow_session via lib/auth/session.js)
         ↓
Protected Dashboard Route (/dashboard)
```

---

## 2. What is Authentication?
**Authentication** is the security mechanism used to verify the identity of a user attempting to access an application. It proves that users are who they claim to be by validating credentials (email and password).

---

## 3. Password Hashing with `bcryptjs`
Plain-text passwords must **never** be stored in a database or logged.

### How `bcryptjs` Works:
1. **Registration:**
   - Plain text password → `bcrypt.hash(password, 10)` → 60-character salted hash → Saved to MongoDB `User` document.
2. **Login Verification:**
   - User enters password → `bcrypt.compare(enteredPassword, user.password)` → Returns `true` if matched, `false` otherwise.
3. **Salting:** `bcrypt` automatically generates a random cryptographic salt for every password, preventing rainbow table attacks.

---

## 4. Why HTTP-Only Cookies vs. `localStorage`

| Feature | HTTP-Only Cookies (Used in Travellow) | `localStorage` (Avoided) |
| :--- | :--- | :--- |
| **XSS Protection** | **Secure.** JavaScript cannot read or extract the session cookie (`httpOnly: true`). | **Vulnerable.** Any malicious XSS script can read `localStorage.getItem("token")`. |
| **Automatic Transmission** | Browser automatically attaches the cookie to same-domain HTTP requests. | Requires manually attaching `Authorization: Bearer <token>` headers to every `fetch`. |
| **CSRF Defense** | Enforced with `sameSite: "lax"`. | Susceptible if token handling is misconfigured. |
| **Path Scoping** | Scoped strictly to domain root (`path: "/"`). | Unscoped within browser origin. |

---

## 5. Session Architecture (`lib/auth/session.js`)

Travellow utilizes a cryptographically signed HMAC token stored in an HTTP-only cookie named `travellow_session`:

- **Cookie Flags:** `httpOnly: true`, `sameSite: "lax"`, `path: "/"`, `maxAge: 7 days`.
- **Token Signing:** Uses HMAC SHA-256 (`crypto.createHmac("sha256", AUTH_SECRET)`).
- **Session Payload:** Contains safe user metadata (`id`, `email`, `name`, `role`, `country`, `preferredCurrency`).
- **Server Verification:** `getSession()` and `getCurrentUser()` inspect the cookie header on the server side to authenticate requests without exposing tokens to client JS.

---

## 6. Authentication API Specification

| Endpoint | Method | Purpose | Key Inputs | Response / Outcome |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Register new user | `name`, `email`, `password`, `phone`, `country`, `preferredCurrency` | Creates `role: "USER"` doc, sets HTTP-only cookie, returns safe user object (`201`). |
| `/api/auth/login` | `POST` | Authenticate user | `email`, `password` | Verifies `bcrypt.compare()`, sets HTTP-only cookie, returns safe user object (`200`). |
| `/api/auth/me` | `GET` | Get current auth state | Session cookie | Returns `{ authenticated: true, user: {...} }` or `{ authenticated: false }`. |
| `/api/auth/logout` | `POST` | Invalidate session | Session cookie | Clears `travellow_session` HTTP-only cookie (`200`). |

---

## 7. Registration & Login Flow

### Registration (`POST /api/auth/register`):
1. Input validation (email format, password min length 6 chars).
2. Check MongoDB for duplicate email (`409 Conflict` if existing).
3. Hash password using `bcrypt.hash(password, 10)`.
4. Insert document into `User` collection with `role: "USER"`.
5. Issue `travellow_session` HTTP-only cookie.
6. Return safe user profile data (excluding password).

### Login (`POST /api/auth/login`):
1. Validate email and password inputs.
2. Find user document by normalized email.
3. Verify password via `bcrypt.compare(enteredPassword, user.password)`.
4. If invalid: return generic `401 Unauthorized` message (`"Invalid email or password"`) without revealing whether email or password was wrong.
5. If valid: issue `travellow_session` HTTP-only cookie.

---

## 8. Protected Routes & Role-Based Security

### Protected Dashboard (`/dashboard`):
- Server-side check via `getCurrentUser()`.
- If session cookie is missing or invalid: server immediately issues `redirect("/sign-in")`.
- If valid: renders personalized welcome banner, profile summary, and placeholder cards for future bookings and AI itineraries.

### Reusable Server Helpers (`lib/auth/session.js`):
- `requireAuth()` — Ensures request is authenticated; throws `UNAUTHORIZED` if missing.
- `requireRole(["ADMIN", "LOCAL_GUIDE"])` — Ensures user possesses specified role; throws `FORBIDDEN` otherwise.

---

## 9. Academic Demo Credentials

The database seed script (`npm run seed`) populates two demo accounts with hashed passwords:

1. **Demo Standard User:**
   - Email: `anney@example.com`
   - Password: `password123`
   - Role: `USER`
2. **Demo Admin User:**
   - Email: `admin@travellow.ai`
   - Password: `password123`
   - Role: `ADMIN`

> [!IMPORTANT]
> These credentials are strictly for local academic development and evaluation purposes.

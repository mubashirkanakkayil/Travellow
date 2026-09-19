# Travellow Phase 4A — Real Booking Backend Architecture & Documentation

This document provides a beginner-friendly, technical overview of the real booking backend system implemented for **Travellow**. It is structured specifically for MCA student project reviews, demonstrations, and viva examinations.

---

## 1. Architecture Flow Diagram

```text
User / Client
     ↓
HTTP-only Session Cookie (travellow_session)
     ↓
Next.js Booking API Route (POST /api/bookings | GET /api/bookings | PATCH /api/bookings/[id])
     ↓
Authentication Verification (lib/auth/session.js via requireAuth())
     ↓
MongoDB Query (Fetch Hotel pricePerNight or Guide hourlyRate)
     ↓
Server-Side Price Calculation (totalAmount = price × duration)
     ↓
MongoDB Atlas Booking Collection (models/Booking.js with status: "PENDING")
```

---

## 2. Booking Architecture Overview
The Phase 4A booking backend supports a **hybrid reservation system** covering two primary travel services:
1. **Hotel Bookings (`HOTEL`):** Calculated per night (`startDate` to `endDate`).
2. **Local Guide Bookings (`GUIDE`):** Calculated per hour (`startDate` + `hours`).

Both booking types maintain strict normalized relationships in MongoDB without duplicating entity documents.

---

## 3. Hotel Booking Flow
1. Client submits `{ bookingType: "HOTEL", hotelId, startDate, endDate, guests }`.
2. Server verifies the user's HTTP-only session cookie.
3. Server queries `Hotel.findById(hotelId)` from MongoDB Atlas.
4. Server computes night count: `numberOfNights = (endDate - startDate) / 86400000`.
5. Server computes total price: `totalAmount = hotel.pricePerNight × numberOfNights`.
6. Server assigns `destination` from `hotel.destination`.
7. Server inserts `Booking` document with `status: "PENDING"`.

---

## 4. Guide Booking Flow
1. Client submits `{ bookingType: "GUIDE", guideId, startDate, hours, guests }`.
2. Server verifies the user's HTTP-only session cookie.
3. Server queries `Guide.findById(guideId)` from MongoDB Atlas.
4. Server validates `hours >= 1`.
5. Server computes total price: `totalAmount = guide.hourlyRate × hours`.
6. Server assigns `destination` from `guide.destination`.
7. Server inserts `Booking` document with `status: "PENDING"`.

---

## 5. Server-Side Price Calculation & Security
To prevent financial tampering, the client is **never trusted** for pricing or user identifiers:
- **Price Origin:** Rates (`pricePerNight` or `hourlyRate`) are fetched directly from MongoDB documents.
- **User Identity:** User ID is extracted from the cryptographically verified `travellow_session` cookie (`getCurrentUser()`).
- **Client Price Rejection:** Any `totalAmount` or `currency` sent in the request body by the client is completely ignored and re-computed on the server.

---

## 6. MongoDB Relationships

```text
Booking Schema (models/Booking.js)
├── user → ObjectId (ref: "User")
├── destination → ObjectId (ref: "Destination")
├── hotel → ObjectId (ref: "Hotel", optional)
└── guide → ObjectId (ref: "Guide", optional)
```

---

## 7. API Specification Table

| Endpoint | Method | Security | Inputs | Description / Response |
| :--- | :--- | :--- | :--- | :--- |
| `/api/bookings` | `POST` | `requireAuth()` | `bookingType`, `hotelId`/`guideId`, `startDate`, `endDate`/`hours`, `guests` | Validates dates/duration, fetches DB price, calculates total, creates `PENDING` booking (`201`). |
| `/api/bookings` | `GET` | `requireAuth()` | Session Cookie | Returns populated user bookings sorted newest first (`200`). |
| `/api/bookings/[id]` | `PATCH` | `requireAuth()` | Booking ID param | Verifies booking ownership (`user === session.id`), updates status to `CANCELLED` (`200`). |

---

## 8. Validation Rules & HTTP Error Status Codes

- `401 Unauthorized` — Missing or invalid HTTP-only authentication session cookie.
- `400 Bad Request` — Missing fields, invalid ObjectId string, `endDate <= startDate`, `guests < 1`, `hours < 1`, or attempting to cancel an already `CANCELLED`/`COMPLETED` booking.
- `404 Not Found` — Nonexistent hotel, guide, or booking ID, or attempting to cancel a booking belonging to another user.
- `500 Internal Error` — Server database connection failure.

---

## 9. Example Request & Response

### Creating a Hotel Booking (`POST /api/bookings`)
**Request:**
```json
{
  "bookingType": "HOTEL",
  "hotelId": "651a2b3c4d5e6f7a8b9c0d1e",
  "startDate": "2026-10-10",
  "endDate": "2026-10-13",
  "guests": 2
}
```
**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Hotel booking created successfully.",
  "data": {
    "_id": "66f1234567890abcdef12345",
    "user": "6508f1a2b3c4d5e6f7a8b9c0",
    "bookingType": "HOTEL",
    "hotel": "651a2b3c4d5e6f7a8b9c0d1e",
    "destination": "6501a2b3c4d5e6f7a8b9c0d1",
    "startDate": "2026-10-10T00:00:00.000Z",
    "endDate": "2026-10-13T00:00:00.000Z",
    "guests": 2,
    "totalAmount": 54000,
    "currency": "INR",
    "status": "PENDING",
    "createdAt": "2026-09-18T15:25:00.000Z"
  }
}
```

---

## 10. MCA Viva Defense Questions & Answers

**Q1: Why is price calculation performed exclusively on the server side?**
*Answer:* Calculating totals on the client allows malicious users to modify request payloads (e.g., setting price to 1 INR). Fetching `pricePerNight` or `hourlyRate` directly from MongoDB on the server guarantees price integrity.

**Q2: How does the API enforce user privacy and booking ownership?**
*Answer:* The server extracts the authenticated user ID from the HTTP-only session cookie via `getCurrentUser()`. All database queries (`find({ user: userId })`) strictly filter by this session ID, preventing unauthorized users from accessing or canceling other users' reservations.

**Q3: How are hotel and guide bookings differentiated in a single schema?**
*Answer:* The `models/Booking.js` schema uses a `bookingType` discriminator (`HOTEL` vs `GUIDE`). For hotel bookings, `hotel` and `endDate` are populated. For guide bookings, `guide` and `hours` are populated. Both reference a common `destination` and `user`.

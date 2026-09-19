# Travellow Phase 4C — My Bookings Dashboard Architecture & Documentation

This document provides a technical, student-friendly reference for the real **My Bookings Dashboard** implemented in **Travellow**. It is structured specifically for MCA project demonstrations, evaluations, and viva defenses.

---

## 1. Architecture & Data Flow Diagrams

### Data Retrieval Flow:
```text
User / Browser (Visits /dashboard)
         ↓
Server Authentication Check (getCurrentUser() via HTTP-only Cookie)
         ↓
Render Dashboard Container & Profile Summary
         ↓
Client Component Request (GET /api/bookings)
         ↓
Server Session Verification (requireAuth())
         ↓
MongoDB Atlas Booking Query (Booking.find({ user: session.id }))
         ↓
Populated Response (hotel, guide, & destination references)
         ↓
Interactive Booking Cards & Type Filters ([ All ] [ Hotels ] [ Guides ])
```

### Cancellation Flow:
```text
User Clicks "Cancel Booking" on Active Reservation Card
         ↓
CancelBookingModal Confirmation Dialog ("Are you sure you want to cancel?")
         ↓
PATCH /api/bookings/[id]
         ↓
Server Session Authentication & Ownership Verification (_id AND user: session.id)
         ↓
Status Verification (Reject if already CANCELLED or COMPLETED)
         ↓
Update MongoDB Document Status to "CANCELLED"
         ↓
Immediate UI State Update (Badge updates to RED CANCELLED, Cancel button hidden)
```

---

## 2. My Bookings Dashboard Architecture
The Phase 4C dashboard integration replaces static placeholders with a live, real-time booking management interface. It presents reservations for both **Hotels** and **Local Guides** with distinct visual card designs while enforcing strict server-side security.

---

## 3. Hotel vs. Guide Booking Display Specifications

### Hotel Booking Card:
- **Header:** Hotel cover image, hotel name, location (`destination.name, destination.country`), `HOTEL` category badge, and current `status` badge.
- **Details Grid:** Check-in date, Check-out date, Guest count, Duration (calculated nights count).
- **Price Footer:** Total amount formatted with currency (`₹` / `$`).
- **Cancellation:** `[ Cancel Booking ]` button displayed ONLY when status is `PENDING` or `CONFIRMED`.

### Guide Booking Card:
- **Header:** Guide profile image, guide name, location (`destination.name, destination.country`), `LOCAL GUIDE` category badge, and current `status` badge.
- **Details Grid:** Tour date, Duration in hours, Guest count, Rate type (`Hourly Tour`).
- **Price Footer:** Total amount formatted with currency (`₹` / `$`).
- **Cancellation:** `[ Cancel Booking ]` button displayed ONLY when status is `PENDING` or `CONFIRMED`.

---

## 4. Booking Status Badges & Styling

| Status | Badge Variant | Visual Styling | Description | Cancellation Allowed? |
| :--- | :--- | :--- | :--- | :--- |
| `PENDING` | `warning` | Amber background / text | Reservation submitted, awaiting host/guide confirmation. | **Yes** |
| `CONFIRMED` | `success` | Emerald background / text | Reservation accepted by host/guide. | **Yes** |
| `CANCELLED` | `danger` | Red background / text | Reservation cancelled by user or host. | **No** (Hidden/Disabled) |
| `COMPLETED` | `info` | Blue background / text | Stay or tour successfully completed. | **No** (Hidden/Disabled) |

---

## 5. Cancellation Mechanics (`PATCH /api/bookings/[id]`)
- **Document Preservation:** Canceling a reservation sets `status = "CANCELLED"` in MongoDB Atlas. The document is **never deleted** from the database.
- **Client State Synchronization:** Upon API response (`200 OK`), the client updates local React state immediately, switching the status badge to red `CANCELLED` and removing the `[ Cancel Booking ]` button without requiring a full page refresh.

---

## 6. Client Filter & State Handling
- **Type Filter Tabs:** `[ All ]`, `[ Hotels ]`, `[ Guides ]` filtering performed in-memory on client without triggering extra backend queries.
- **Loading State:** 2 animated skeleton cards rendered during data fetch.
- **Empty State:** Illustrated `"No bookings yet"` screen with `"Explore Hotels"` and `"Explore Guides"` navigation buttons.
- **Error State:** `"Unable to load your bookings"` alert banner with `"Try Again"` retry button.

---

## 7. MCA Viva Defense Questions & Answers

**Q1: Why does canceling a booking update its status rather than deleting the document from MongoDB?**
*Answer:* Deleting documents destroys audit trails and historical transaction logs required for analytical reporting and dispute resolution. Updating `status = "CANCELLED"` preserves database integrity while reflecting the updated state in the application.

**Q2: How does the dashboard ensure users only see their own bookings?**
*Answer:* The client calls `GET /api/bookings` without passing any user ID parameters. The server handler invokes `getCurrentUser()`, extracting identity strictly from the verified `travellow_session` HTTP-only cookie, and executes `Booking.find({ user: session.id })`.

**Q3: How is client-side filtering handled without increasing backend load?**
*Answer:* `GET /api/bookings` returns all active and past bookings for the authenticated user in a single request. The client component filters the array in memory when the user toggles between `[ All ]`, `[ Hotels ]`, and `[ Guides ]` tabs, eliminating unnecessary network roundtrips.

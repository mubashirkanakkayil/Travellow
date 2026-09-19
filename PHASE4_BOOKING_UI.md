# Travellow Phase 4B — Booking UI Architecture & Documentation

This document provides a technical, student-friendly reference for the client-side booking user interface implemented in **Travellow**. It is designed for MCA project demonstrations, evaluations, and viva defenses.

---

## 1. Booking UI Architecture & Flow Diagram

```text
User Action (Click "Book Now" on HotelCard or "Book Guide" on GuideCard)
                      ↓
Auth Check Request (GET /api/auth/me)
           ┌──────────┴──────────┐
      Unauthenticated       Authenticated
           ↓                     ↓
    AuthPromptModal       HotelBookingModal / GuideBookingModal
  ("Sign in to book")      (Date Selection & Guest Controls)
                                 ↓
                         Client Form Validation
                                 ↓
                         POST /api/bookings
                 (Sends only IDs, dates, & guest counts)
                                 ↓
                         Server Price Calculation
                                 ↓
                         Booking Confirmation View
                    (Displays server total & status: PENDING)
```

---

## 2. Hotel Booking UI Flow (`components/bookings/HotelBookingModal.js`)
1. **Modal Header:** Displays hotel name, cover image, rating, and location.
2. **Inputs:** Check-in date (`startDate`), Check-out date (`endDate`), Guest counter (`-` / `+`).
3. **Dynamic Night & Price Display:** Computes `numberOfNights = (endDate - startDate) / 86400000` and displays estimated total `numberOfNights × pricePerNight`.
4. **Submission Payload:** Sends `{ bookingType: "HOTEL", hotelId, startDate, endDate, guests }` to `POST /api/bookings`. Client does **not** send `totalAmount` or `pricePerNight`.
5. **Confirmation View:** Displays `"Booking Created Successfully!"` with hotel metadata, formatted dates, guest count, server-calculated total amount, `status: PENDING`, and navigation buttons (`[ Go to Dashboard ]`, `[ Continue Exploring ]`).

---

## 3. Guide Booking UI Flow (`components/bookings/GuideBookingModal.js`)
1. **Modal Header:** Displays guide profile avatar, name, verified badge, rating, location, and hourly rate.
2. **Inputs:** Tour Date (`startDate`), Hours counter (`-` / `+`), Guest counter (`-` / `+`).
3. **Dynamic Total Display:** Computes estimated total `hours × hourlyRate`.
4. **Submission Payload:** Sends `{ bookingType: "GUIDE", guideId, startDate, hours, guests }` to `POST /api/bookings`.
5. **Confirmation View:** Displays `"Booking Created Successfully!"` with guide metadata, tour date, duration in hours, guest count, server-calculated total amount, `status: PENDING`, and navigation buttons (`[ Go to Dashboard ]`, `[ Continue Exploring ]`).

---

## 4. Authentication Check UX (`components/bookings/AuthPromptModal.js`)
- Before opening any booking modal, `HotelCard` and `GuideCard` issue a lightweight call to `GET /api/auth/me`.
- **Logged Out:** Renders `AuthPromptModal` informing the user: *"Please sign in to your Travellow account before making a booking."* Buttons provided: `[ Sign In ]` (`/sign-in`) and `[ Cancel ]`.
- **Logged In:** Directly opens the interactive `HotelBookingModal` or `GuideBookingModal`.

---

## 5. Client vs. Server Validation & Security

| Validation / Feature | Client Responsibilities | Server Responsibilities (Authority) |
| :--- | :--- | :--- |
| **Check-in / Check-out Dates** | Validates check-in is selected, check-out is strictly after check-in. | Verifies date objects, re-calculates exact number of nights. |
| **Guests & Hours** | Enforces minimum value $\ge 1$ using counter controls. | Validates positive integers $\ge 1$. |
| **Pricing & Totals** | Displays estimated total for user convenience. | **100% Price Authority.** Ignores client amounts; fetches DB rates and computes total amount. |
| **User Identity** | Passes HTTP-only cookie automatically. | **100% Identity Authority.** Obtains user ID from verified `travellow_session` cookie. |

---

## 6. MCA Viva Defense Questions & Answers

**Q1: How does the application prevent unauthorized bookings by unauthenticated users?**
*Answer:* When a user clicks a booking button on a card, the application queries `/api/auth/me`. If the user is unauthenticated, an authentication modal (`AuthPromptModal`) redirects them to `/sign-in`. Furthermore, the backend endpoint (`POST /api/bookings`) invokes `getCurrentUser()`, rejecting any unauthenticated requests with `401 Unauthorized`.

**Q2: Why is the price estimated on the client but calculated on the server?**
*Answer:* The client UI displays an estimated price to provide immediate visual feedback to the user. However, to prevent client-side price tampering (e.g., editing JavaScript variables in dev tools), the client only transmits the hotel or guide ID and booking duration. The server fetches the authoritative rate directly from MongoDB and computes the final `totalAmount`.

**Q3: How are date calculation bugs (such as timezone shifts) prevented?**
*Answer:* Date strings from `<input type="date">` are parsed consistently into JavaScript `Date` objects on the server. Night counts are calculated using UTC midnight differences (`Math.ceil(diffTime / 86400000)`), ensuring consistent duration calculation regardless of user timezone.

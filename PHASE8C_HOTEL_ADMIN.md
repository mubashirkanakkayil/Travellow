# PHASE 8C — ADMIN HOTEL MANAGEMENT CRUD

## Overview
Phase 8C introduces complete Hotel CRUD (Create, Read, Update, Delete) management capabilities within the Travellow Admin Panel (`/admin/hotels`). All admin endpoints require server-side session authentication with the `ADMIN` role. The implementation features input validation, referenced MongoDB `Destination` validation, safe deletion dependency checks (blocking deletion if related bookings or reviews exist), rating/review count protection, dynamic destination dropdown selection, and full compatibility with existing booking calculation logic and Gemini AI recommendation contexts.

---

## 1. Files Created & Modified

### New Files Created
1. `app/api/admin/hotels/route.js`
   - Handles `GET` (search, destination filter, country filter, featured filter, aiEligible filter, sorting, pagination metadata, populated destination).
   - Handles `POST` (creates a hotel with input validation, destination ObjectId check, price $\ge 0$ check, coordinate bounds validation, and default `rating: 0`).

2. `app/api/admin/hotels/[id]/route.js`
   - Handles `GET` (fetches a single hotel by ID with populated destination).
   - Handles `PATCH` (updates hotel details, validates destination if modified, preserves rating and review count).
   - Handles `DELETE` (safe deletion with dependency checks across `Booking` and `Review` collections; blocks deletion with `409 Conflict` if dependent records exist).

3. `components/admin/hotels/HotelFormModal.js`
   - Reusable modal dialog for creating and editing hotels.
   - Fetches real MongoDB destinations for selection.
   - Automatic country population, line-separated textareas for array fields (`gallery`, `amenities`), price/currency, coordinates, and preview image box.

4. `app/admin/hotels/page.js`
   - Main Admin Hotel Management UI.
   - Features responsive desktop data table and mobile card view.
   - Toolbar with live search, destination dropdown filter, featured status filter, and AI eligibility filter.
   - Delete confirmation modal with dependency protection alert and conflict error handling.

5. `PHASE8C_HOTEL_ADMIN.md`
   - Phase 8C documentation and technical reference.

### Files Modified
1. `app/admin/AdminClientLayout.js`
   - Updated sidebar navigation menu links to point directly to `/admin/destinations` and `/admin/hotels`.

---

## 2. API Endpoints

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `GET` | `/api/admin/hotels` | Admin Only | Retrieves all hotels with optional `search`, `destination`, `country`, `featured`, `aiEligible`, `sort`, `page`, and `limit` query parameters. |
| `POST` | `/api/admin/hotels` | Admin Only | Creates a new hotel. Validates required fields, valid `Destination` ObjectId, price $\ge 0$, and coordinate bounds. Forces `rating: 0` and `reviewCount: 0`. |
| `GET` | `/api/admin/hotels/[id]` | Admin Only | Fetches a single hotel by ID with populated destination details. |
| `PATCH` | `/api/admin/hotels/[id]` | Admin Only | Updates hotel details by ID. Validates destination if modified. Protects `rating` and `reviewCount` from client override. |
| `DELETE` | `/api/admin/hotels/[id]` | Admin Only | Safely deletes a hotel if no dependent `Booking` or `Review` records exist. |

---

## 3. Architecture & Data Flow

```
                      [ Admin User ]
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
   [ GET /admin/hotels ]           [ Click Add/Edit ]
            │                               │
            ▼                               ▼
   Fetches Hotel List              Opens HotelFormModal
   - Filter by Destination         - Fetches MongoDB Destinations
   - Filter by Featured/AI         - Auto-populates Country
   - Live Search                   - Line-separated Amenities/Gallery
   - Responsive Table/Cards        - Submit POST or PATCH
            │                               │
            └───────────────┬───────────────┘
                            │
                            ▼
                   [ API Server Validation ]
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
[ Safe Delete Safeguard ]           [ Database Sync ]
Check dependent collections:         MongoDB `hotels` collection
- Bookings                           updated via Mongoose model
- Reviews                                      │
                                               ▼
                                    Reflected on Public Site
                                    - /hotels & HotelCard
                                    - Hotel Booking Modal
                                    - Gemini AI Planner
```

---

## 4. Input Validation & Security

### Authorization Controls
- Server-side token verification via `getCurrentUser(request)`.
- Returns `401 Unauthorized` for unauthenticated requests.
- Returns `403 Forbidden` for non-admin roles (`USER`, `LOCAL_GUIDE`).
- Frontend-supplied user IDs or role claims are strictly ignored.

### Validation Rules
- **Required Fields:** `name`, `destination` (valid ObjectId of an existing `Destination` document), `country`, `description`, `image`, `pricePerNight`.
- **Price Validation:** `pricePerNight` must be a valid number $\ge 0$.
- **Coordinate Bounds:** `latitude` must be between $-90$ and $90$; `longitude` must be between $-180$ and $180$.
- **Currency Enum Check:** `currency` must match allowed schema enum (`"INR"`, `"USD"`, `"AED"`, `"EUR"`, `"GBP"`, `"JPY"`).
- **Arrays:** `gallery` and `amenities` are formatted as trimmed string arrays.
- **Rating Protection:** `rating` and `reviewCount` are strictly protected from client manipulation. New hotels start with `rating: 0` and `reviewCount: 0`. Ratings update dynamically when users post reviews.

---

## 5. Safe Delete Dependency Safeguard

To prevent corrupt booking history or orphaned guest reviews:

```javascript
const [bookingCount, reviewCount] = await Promise.all([
  Booking.countDocuments({ hotel: id }),
  Review.countDocuments({ hotel: id }),
]);
```

- If `bookingCount > 0` or `reviewCount > 0`, deletion is blocked with an HTTP `409 Conflict` response listing active dependencies (e.g. *"Cannot delete this hotel because related 1 booking(s) exist."*).
- The admin UI modal presents this error message directly without removing the item from the list.

---

## 6. Public Website, Booking, & AI Compatibility

- **Public Hotels Page (`/hotels`):** Consumes `/api/hotels`, displaying newly created or updated hotels with populated destination names, prices, amenities, and image cards.
- **Booking Compatibility:** The existing hotel booking endpoint (`/api/bookings`) computes booking totals on the server (`totalAmount = hotel.pricePerNight * nights`). Modifying hotel pricing or details in Admin preserves exact booking calculations without breaking user checkouts.
- **AI Eligibility:** Toggling `aiEligible` directly controls whether Gemini AI includes the hotel in weather-aware or itinerary recommendations.

---

## 7. Testing Summary

### Automated Backend Tests (`scratch/test-admin-hotels-crud.mjs`)
1. **Authorization Guard:** `401` for unauthenticated requests, `403` for standard users, `200` for admin users.
2. **Input Validations:** Rejection of invalid destination ObjectId (`400`), negative price (`400`), and missing required fields (`400`).
3. **Creation & Read:** Verified hotel creation with default `rating: 0` and populated destination details on retrieval (`201` & `200`).
4. **Update & Rating Protection:** Verified price update via `PATCH` while ensuring rating manipulation attempts are ignored (`200`).
5. **Safe Delete Safeguard:** Created linked test booking; `DELETE` returned `409 Conflict` with dependency details. Removed booking and executed `DELETE`; returned `200 OK` and cleanly removed hotel.

---

## 8. Build Result & Status

- Next.js production build (`npm run build`) completed with **0 errors**.
- All static/dynamic pages compiled cleanly:
  - `ƒ /admin/hotels` (9.11 kB)
  - `ƒ /api/admin/hotels` (0 B)
  - `ƒ /api/admin/hotels/[id]` (0 B)

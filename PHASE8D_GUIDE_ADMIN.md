# PHASE 8D — ADMIN GUIDE MANAGEMENT CRUD

## Overview
Phase 8D introduces complete Local Guide CRUD (Create, Read, Update, Delete) management capabilities within the Travellow Admin Panel (`/admin/guides`). All admin guide endpoints require server-side session authentication with the `ADMIN` role. The implementation features input validation, referenced MongoDB `Destination` validation, safe deletion dependency checks (blocking deletion if related bookings or reviews exist), rating/review count protection, verified status toggling, multi-line language and specialty parsing, and full compatibility with existing guide booking calculation logic and Gemini AI recommendation contexts.

---

## 1. Files Created & Modified

### New Files Created
1. `app/api/admin/guides/route.js`
   - Handles `GET` (search, destination filter, country filter, verified filter, sorting, pagination metadata, populated destination).
   - Handles `POST` (creates a guide with input validation, destination ObjectId check, hourly rate $\ge 0$, experience years $\ge 0$, and default `rating: 0`).

2. `app/api/admin/guides/[id]/route.js`
   - Handles `GET` (fetches a single guide by ID with populated destination).
   - Handles `PATCH` (updates guide details, validates destination if modified, preserves rating and review count).
   - Handles `DELETE` (safe deletion with dependency checks across `Booking` and `Review` collections; blocks deletion with `409 Conflict` if dependent records exist).

3. `components/admin/guides/GuideFormModal.js`
   - Reusable modal dialog for creating and editing local guides.
   - Fetches real MongoDB destinations for selection.
   - Automatic country population, line-separated textareas for array fields (`languages`, `specialties`), hourly rate/currency, experience years, profile photo preview box, and verified toggle.

4. `app/admin/guides/page.js`
   - Main Admin Guide Management UI.
   - Features responsive desktop data table and mobile card view.
   - Toolbar with live search, destination dropdown filter, verified status filter, and sorting.
   - Delete confirmation modal with dependency protection alert and conflict error handling.

5. `PHASE8D_GUIDE_ADMIN.md`
   - Phase 8D documentation and technical reference.

### Files Modified
1. `app/admin/AdminClientLayout.js`
   - Updated sidebar navigation menu link for `Guides` to point directly to `/admin/guides`.

---

## 2. API Endpoints

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `GET` | `/api/admin/guides` | Admin Only | Retrieves all guides with optional `search`, `destination`, `country`, `verified`, `sort`, `page`, and `limit` query parameters. |
| `POST` | `/api/admin/guides` | Admin Only | Creates a new guide. Validates required fields, valid `Destination` ObjectId, hourly rate $\ge 0$, experience years $\ge 0$. Forces `rating: 0` and `reviewCount: 0`. |
| `GET` | `/api/admin/guides/[id]` | Admin Only | Fetches a single guide by ID with populated destination details. |
| `PATCH` | `/api/admin/guides/[id]` | Admin Only | Updates guide details by ID. Validates destination if modified. Protects `rating` and `reviewCount` from client override. |
| `DELETE` | `/api/admin/guides/[id]` | Admin Only | Safely deletes a guide if no dependent `Booking` or `Review` records exist. |

---

## 3. Architecture & Data Flow

```
                      [ Admin User ]
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
   [ GET /admin/guides ]           [ Click Add/Edit ]
            │                               │
            ▼                               ▼
   Fetches Guide List              Opens GuideFormModal
   - Filter by Destination         - Fetches MongoDB Destinations
   - Filter by Verified Status     - Auto-populates Country
   - Live Search & Sort            - Line-separated Languages/Specialties
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
Check dependent collections:         MongoDB `guides` collection
- Bookings                           updated via Mongoose model
- Reviews                                      │
                                               ▼
                                    Reflected on Public Site
                                    - /guides & GuideCard
                                    - Guide Booking Modal
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
- **Required Fields:** `name`, `destination` (valid ObjectId of an existing `Destination` document), `country`, `bio`, `profileImage`, `hourlyRate`, `experienceYears`.
- **Pricing & Experience:** `hourlyRate` must be a valid number $\ge 0$; `experienceYears` must be an integer $\ge 0$.
- **Currency Enum Check:** `currency` must match allowed schema enum (`"INR"`, `"USD"`, `"AED"`, `"EUR"`, `"GBP"`, `"JPY"`).
- **Arrays:** `languages` and `specialties` are formatted as trimmed string arrays.
- **Rating Protection:** `rating` and `reviewCount` are strictly protected from client manipulation. New guides start with `rating: 0` and `reviewCount: 0`. Ratings update dynamically when users post reviews.
- **Verified Status:** `verified` boolean toggle determines whether a verified badge is rendered.

---

## 5. Safe Delete Dependency Safeguard

To prevent corrupt booking history or orphaned guest reviews:

```javascript
const [bookingCount, reviewCount] = await Promise.all([
  Booking.countDocuments({ guide: id }),
  Review.countDocuments({ guide: id }),
]);
```

- If `bookingCount > 0` or `reviewCount > 0`, deletion is blocked with an HTTP `409 Conflict` response listing active dependencies (e.g. *"Cannot delete this guide because related 1 booking(s) exist."*).
- The admin UI modal presents this error message directly without removing the item from the list.

---

## 6. Public Website, Booking, & AI Compatibility

- **Public Guides Page (`/guides`):** Consumes `/api/guides`, displaying newly created or updated guides with populated destination names, hourly rates, experience badges, and profile image cards.
- **Booking Compatibility:** The existing guide booking endpoint (`/api/bookings`) computes booking totals on the server (`totalAmount = guide.hourlyRate * hours`). Modifying guide hourly rates in Admin preserves exact booking calculations without breaking user checkouts. Existing bookings retain historical totals.
- **Gemini AI Integration:** The AI system consumes real MongoDB `Guide` records, recommending verified local experts based on active destination matches.

---

## 7. Testing Summary

### Automated Backend Tests (`scratch/test-admin-guides-crud.mjs`)
1. **Authorization Guard:** `401` for unauthenticated requests, `403` for standard users, `200` for admin users.
2. **Input Validations:** Rejection of invalid destination ObjectId (`400`), negative hourly rate (`400`), and missing required fields (`400`).
3. **Creation & Read:** Verified guide creation with default `rating: 0` and populated destination details on retrieval (`201` & `200`).
4. **Update & Rating Protection:** Verified hourly rate update via `PATCH` while ensuring rating manipulation attempts are ignored (`200`).
5. **Safe Delete Safeguard:** Created linked test booking; `DELETE` returned `409 Conflict` with dependency details. Removed booking and executed `DELETE`; returned `200 OK` and cleanly removed guide.

---

## 8. Build Result & Status

- Next.js production build (`npm run build`) completed with **0 errors**.
- All static/dynamic pages compiled cleanly:
  - `ƒ /admin/guides` (8.83 kB)
  - `ƒ /api/admin/guides` (0 B)
  - `ƒ /api/admin/guides/[id]` (0 B)

# Phase 5B — Real Gemini AI Integration Documentation

## Overview
Phase 5B implements the first real AI feature of **Travellow**: a grounded, database-aware **AI Trip Planner** powered by Google's official `@google/genai` JavaScript SDK and the `gemini-3.6-flash` model.

Unlike generic chatbots, the AI Trip Planner is strictly grounded in Travellow's MongoDB Atlas database context. Recommended accommodations and local guides are cross-referenced on the server against real database records to eliminate AI hallucinations.

---

## 1. Tech Stack & SDK
- **Gemini SDK**: Current official `@google/genai` JavaScript SDK (`npm install @google/genai`)
- **Default Model**: `gemini-3.6-flash` (configurable via `process.env.GEMINI_MODEL`)
- **API Key**: `process.env.GEMINI_API_KEY` loaded strictly on the server side
- **Framework**: Next.js 14 App Router (Node.js runtime)
- **Database**: MongoDB Atlas + Mongoose (`Destination`, `Hotel`, `Guide`, `AIChat` models)

---

## 2. Environment Variables & Security
- `GEMINI_API_KEY`: Server-side API key. Never exposed to browser or client code.
- `GEMINI_MODEL`: Model name setting (defaults to `gemini-3.6-flash`).
- **Security Principles**:
  - Gemini requests occur exclusively in server-side API routes (`app/api/ai/trip-planner/route.js`).
  - No `NEXT_PUBLIC_GEMINI_API_KEY` or frontend credentials exist.
  - User inputs are sanitized and treated as raw string data to prevent prompt injection attempts.
  - Booking authority remains strictly within application server logic (AI output generates estimates, not binding quotes).

---

## 3. Architecture & Data Flow

```
[User Form / UI]
       │
       ▼ (POST /api/ai/trip-planner)
[Server Authentication Check (HTTP-Only Cookie)]
       │
       ▼
[MongoDB Context Query]
 ├── Find Destination (e.g. Goa, Kerala, Jaipur)
 ├── Fetch Destination Hotels (Hotel Model)
 └── Fetch Destination Guides (Guide Model)
       │
       ▼
[Gemini AI Request (@google/genai)]
 ├── System Instruction: Grounding & Strict Rules
 ├── User Preferences (Destination, Budget, Duration, Travelers, Style, Interests)
 └── Minimal DB Context (Hotels & Guides context arrays)
       │
       ▼
[Gemini Structured JSON Response (gemini-3.6-flash)]
       │
       ▼
[Mandatory Server-Side ID Verification]
 ├── Cross-reference recommended hotel IDs with MongoDB records
 └── Cross-reference recommended guide IDs with MongoDB records
 └── Strip any unverified / hallucinated IDs
       │
       ▼
[AIChat Session Logging (MongoDB)]
 └── Save User Request & Assistant Response to `AIChat` collection
       │
       ▼
[Client Response & Interactive Itinerary Render]
 ├── Day-by-Day Itinerary (Morning, Afternoon, Evening)
 ├── Verified Hotel Cards -> Click opens HotelBookingModal
 └── Verified Guide Cards -> Click opens GuideBookingModal
```

---

## 4. Database Grounding & Hallucination Filtering

### A. Context Grounding
Before invoking Gemini, the server retrieves matching MongoDB records for the destination:
- **Destination**: `name`, `country`, `description`, `bestTimeToVisit`, `activities`, `highlights`.
- **Hotels**: Array of `{ id, name, pricePerNight, rating, amenities, description }`.
- **Guides**: Array of `{ id, name, hourlyRate, rating, languages, specialties, experienceYears }`.

### B. Verification & Hallucination Removal
Gemini returns structured JSON with `recommendedHotels` and `recommendedGuides` containing `id` strings.
The server performs mandatory verification:
1. Maps available MongoDB hotel IDs into a lookup `Map`.
2. Checks each AI-recommended hotel ID against the map.
3. If an ID does not exist in the database, it is **discarded**.
4. Verified entities are enriched with complete MongoDB fields (images, real price, ratings, address) before returning to the frontend.

---

## 5. AIChat Storage
Each successful AI trip planning interaction is persisted into the `AIChat` Mongoose collection:
- `user`: Authenticated User ObjectId
- `sessionId`: Unique session string (e.g. `trip_1726743849_x8a91z`)
- `messages`: Array of `USER` input preferences and `ASSISTANT` structured response summary

---

## 6. Endpoints Created / Modified

### `POST /api/ai/trip-planner`
- **Auth**: Required (`getCurrentUser(req)`)
- **Request Body**:
  ```json
  {
    "destination": "Goa",
    "duration": 5,
    "budget": 30000,
    "travelers": 2,
    "travelStyle": "Comfortable",
    "interests": ["Beaches", "Food", "Culture"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "sessionId": "trip_1726743849_x8a91z",
    "data": {
      "summary": "...",
      "destination": { ... },
      "duration": 5,
      "estimatedBudget": { "amount": 30000, "currency": "INR" },
      "days": [ ... ],
      "recommendedHotels": [ ... ],
      "recommendedGuides": [ ... ],
      "travelTips": [ ... ]
    }
  }
  ```

---

## 7. Frontend Integration
- **`components/home/AIPlannerSection.js`**:
  - Interactive destination selector + custom destination search.
  - Duration, budget, travelers, travel style, and interest options.
  - Unauthenticated user check (triggers `AuthPromptModal`).
  - Loading spinner state ("Creating your personalized trip with Gemini AI...").
  - Rich day-by-day timeline view.
  - Verified hotel cards connected to `HotelBookingModal`.
  - Verified guide cards connected to `GuideBookingModal`.
- **`app/trip-planner/page.js`**:
  - Page wrapper for AI Trip Planner with feature banner.

---

## 8. Verification Results
1. **SDK Migration**: Replaced legacy `@google/generative-ai` with current official `@google/genai`.
2. **End-to-End Test**: Server connected to MongoDB, loaded Goa context, called `gemini-3.6-flash`, returned structured itinerary, verified hotel ID `6aadad80c305d53917693665`, and created `AIChat` record.
3. **Build Health**: Executed `npm run build` — 13/13 pages static/dynamic prerendered with **0 errors and 0 warnings**.

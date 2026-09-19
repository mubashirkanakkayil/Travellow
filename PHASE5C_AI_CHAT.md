# Phase 5C — Real AI Travel Assistant / Chatbot Documentation

## Overview
Phase 5C completes the AI capabilities of **Travellow** by implementing a real multi-turn **AI Travel Assistant / Chatbot** powered by Google's official `@google/genai` JavaScript SDK and `gemini-3.6-flash`.

The chatbot maintains conversational history across messages while remaining grounded in Travellow's MongoDB Atlas database context (`Destinations`, `Hotels`, `Guides`). Entity recommendations are verified on the server to prevent AI hallucinations.

---

## 1. Architecture & Tech Stack
- **Gemini SDK**: `@google/genai`
- **Model**: `gemini-3.6-flash` (configurable via `process.env.GEMINI_MODEL`)
- **API Key**: `process.env.GEMINI_API_KEY` (strictly server-side)
- **Session & History Storage**: `AIChat` Mongoose model (`user`, `sessionId`, `messages[]`)
- **Authentication**: HTTP-only cookie authentication (`getCurrentUser(req)`)
- **Framework**: Next.js 14 App Router (Node.js runtime)

---

## 2. API Endpoint (`POST /api/ai/chat`)

### Request Format:
```json
{
  "message": "Which hotels do you have in Goa?",
  "sessionId": "chat_1726745000_abc123"
}
```

### Response Format:
```json
{
  "success": true,
  "sessionId": "chat_1726745000_abc123",
  "message": {
    "role": "ASSISTANT",
    "content": "For your stay in Goa, I recommend Taj Fort Aguada Resort & Spa..."
  },
  "recommendedHotels": [
    {
      "_id": "6aadad80c305d53917693665",
      "name": "Taj Fort Aguada Resort & Spa",
      "rating": 4.8,
      "pricePerNight": 18000,
      "currency": "INR",
      "aiReason": "A historic 5-star beachfront resort in Goa..."
    }
  ],
  "recommendedGuides": []
}
```

---

## 3. Database Grounding & Hallucination Filtering

### Grounding Payload
Before calling Gemini, the server fetches matching MongoDB entities:
- **Destinations**: `name`, `country`, `description`, `bestTimeToVisit`, `activities`, `highlights`, `startingPrice`.
- **Hotels**: `id`, `name`, `destinationName`, `rating`, `pricePerNight`, `currency`, `amenities`.
- **Guides**: `id`, `name`, `destinationName`, `rating`, `hourlyRate`, `languages`, `specialties`, `experienceYears`.

### Verification Logic
- AI JSON output returns `recommendedHotels` and `recommendedGuides` containing `id` strings.
- Server validates each returned `id` against actual database records loaded in memory.
- Unrecognized or fake IDs are **stripped out**.
- Verified IDs are enriched with complete MongoDB fields (images, ratings, rates) before reaching the frontend.

---

## 4. Multi-Turn Session & History Management
1. **First Message**: If no `sessionId` is provided, the server creates a unique `sessionId` (e.g. `chat_1726745000_abc123`) linked to `user._id` and returns it to the client.
2. **Follow-Up Messages**: The client sends the same `sessionId`. The server fetches the `AIChat` document for that user and retrieves the last 10 messages.
3. **Context Awareness**: Gemini receives the full message timeline so it understands follow-ups (e.g., `"Which hotel do you recommend there?"` understands `"there"` refers to Goa from the previous turn).
4. **Persistence**: New `USER` and `ASSISTANT` messages are atomically appended to `AIChat.messages` in MongoDB.

---

## 5. Frontend & Booking Integration
- **`components/home/AIAssistantSection.js`**:
  - Interactive message timeline with animated typing indicator.
  - Message input box with 500-character counter.
  - Suggested question pills for quick testing.
  - **"Start New Chat"** button to clear session state.
  - Embedded **Recommended Stays** & **Recommended Local Guides** cards inside chat bubbles.
  - Direct **"Book Hotel"** button opening `HotelBookingModal`.
  - Direct **"Book Guide"** button opening `GuideBookingModal`.
  - Auth protection using `AuthPromptModal` for logged-out users.

---

## 6. Verification Results
1. **Multi-Turn Chat Test**: Verified initial question ("What should I do in Goa?") and follow-up ("Which hotel do you recommend there?"). Gemini understood context, recommended `Taj Fort Aguada Resort & Spa`, verified hotel ID against MongoDB, and persisted 4 messages in `AIChat`.
2. **Production Build**: Executed `npm run build` — 13/13 pages static/dynamic prerendered with **0 errors and 0 warnings**.

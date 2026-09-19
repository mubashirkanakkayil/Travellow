# Travellow Phase 2 — Database Architecture & Documentation

This document provides a beginner-friendly overview of the database architecture implemented for **Travellow**. It is designed to help explain the technical database concepts during MCA project reviews, demonstrations, and viva examinations.

---

## 1. What is MongoDB Atlas?
**MongoDB Atlas** is a fully managed cloud database service. Unlike traditional SQL databases (like MySQL) that store data in rigid tables with rows and columns, MongoDB stores data in flexible, JSON-like documents (known as BSON).

---

## 2. Why MongoDB was Selected for Travellow
- **Dynamic Travel Data:** Travel entities like destinations, hotels, and guides have varying attributes (e.g. activities, gallery images, specialized tags).
- **Scalability & Cloud Hosting:** MongoDB Atlas enables effortless cloud hosting with automatic IP security controls and high availability.
- **AI Compatibility:** Storing structured JSON documents simplifies passing database records to AI models like Google Gemini in future phases.

---

## 3. What is Mongoose?
**Mongoose** is an Object Data Modeling (ODM) library for Node.js and MongoDB. It manages relationships between data, provides schema validation, and translates Node.js JavaScript objects into MongoDB database commands.

In Travellow, Mongoose schemas enforce field types (e.g., `rating` between `0–5`, `startingPrice` non-negative) and support global connection caching (`lib/db/connect.js`) to prevent redundant connections in Next.js serverless environments.

---

## 4. Key Database Terms

| Term | Definition |
| :--- | :--- |
| **Collection** | A grouping of MongoDB documents (equivalent to a table in SQL). Example: `destinations`, `hotels`. |
| **Document** | A single record inside a collection formatted as JSON key-value pairs. Example: One hotel record. |
| **ObjectId** | A unique 12-byte hexadecimal identifier automatically assigned by MongoDB to every document (`_id`). |

---

## 5. Our 7 Database Collections & Schemas

Travellow implements 7 dedicated Mongoose models in `models/`:

1. **`User` (`models/User.js`)**
   - **Purpose:** Stores user profiles, roles (`USER`, `ADMIN`, `LOCAL_GUIDE`), hashed passwords (`bcryptjs`), and preferred currency (`INR`, `USD`, `EUR`, etc.).
   - **Key Fields:** `name`, `email` (unique), `password` (hashed), `role`, `preferredCurrency`.

2. **`Destination` (`models/Destination.js`)**
   - **Purpose:** Central catalog for travel locations across initial regions (`INDIA`, `ASIA`, `EUROPE`).
   - **Key Fields:** `name`, `country`, `region`, `slug` (unique index), `description`, `startingPrice`, `activities`, `highlights`.

3. **`Hotel` (`models/Hotel.js`)**
   - **Purpose:** Accommodations and luxury stays linked to a destination.
   - **Key Fields:** `name`, `destination` (ObjectId ref), `pricePerNight`, `amenities`, `rating`, `aiEligible`.

4. **`Guide` (`models/Guide.js`)**
   - **Purpose:** Verified local tour guides providing authentic local tours.
   - **Key Fields:** `name`, `destination` (ObjectId ref), `languages`, `specialties`, `hourlyRate`, `verified`.

5. **`Booking` (`models/Booking.js`)**
   - **Purpose:** Foundation for future reservation records.
   - **Key Fields:** `user` (ref), `bookingType` (`HOTEL`/`GUIDE`), `hotel` (ref), `guide` (ref), `destination` (ref), `startDate`, `endDate`, `totalAmount`, `status`.

6. **`Review` (`models/Review.js`)**
   - **Purpose:** Ratings (1–5) and comments submitted by users for destinations, hotels, or guides.
   - **Key Fields:** `user` (ref), `destination` (ref), `hotel` (ref), `guide` (ref), `rating`, `comment`.

7. **`AIChat` (`models/AIChat.js`)**
   - **Purpose:** Conversation histories between users and future AI travel assistants.
   - **Key Fields:** `user` (ref), `sessionId`, `messages` (`role`, `content`, `timestamp`).

---

## 6. Database Relationships & ObjectId References

Travellow uses **Normalized Database Referencing** using Mongoose `ObjectId` references rather than duplicating full documents:

```
User
 ├── Bookings (User ID ref)
 └── Reviews (User ID ref)

Destination (Central Entity)
 ├── Hotels (Destination ID ref)
 ├── Guides (Destination ID ref)
 ├── Bookings (Destination ID ref)
 └── Reviews (Destination ID ref)
```

### Why References are Used instead of Embedding:
- **Data Consistency:** Updating a destination name or country automatically reflects across all associated hotels and guides.
- **Performance:** Prevents documents from becoming bloated with duplicated data.
- **Maintainability:** Standard relational pattern easy to explain in project defense.

---

## 7. How the API Communicates with MongoDB

```
Browser / React Frontend
        ↓ (HTTP GET Request)
Next.js App Router API Route (/api/destinations)
        ↓
lib/db/connect.js (Cached Mongoose Connection)
        ↓
MongoDB Atlas Cloud Database
        ↓ (BSON Documents Returned)
JSON Response Sent to Frontend Card Components
```

---

## 8. Why the Database is NOT Accessed Directly from the Browser
- **Security:** Connecting directly from the browser would expose secret credentials (`MONGODB_URI`) to anyone inspecting web pages.
- **Environment Secrecy:** `.env.local` remains server-side only.
- **Connection Pooling:** Serverless functions manage connection pools cleanly through `lib/db/connect.js`.

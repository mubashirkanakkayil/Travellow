import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import Destination from "@/models/Destination";
import Hotel from "@/models/Hotel";
import Guide from "@/models/Guide";
import AIChat from "@/models/AIChat";
import { getCurrentUser } from "@/lib/auth/session";
import { generateAIPlan } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    // 1. Authenticate User
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required. Please sign in to generate personalized AI trip plans.",
        },
        { status: 401 }
      );
    }

    // 2. Check API Key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "Gemini AI key is not configured on the server.",
        },
        { status: 500 }
      );
    }

    // 3. Parse & Validate Request Body
    const body = await req.json();
    const { destination, duration, budget, travelers, travelStyle, interests } = body;

    if (!destination || typeof destination !== "string" || !destination.trim()) {
      return NextResponse.json(
        { success: false, message: "Please select or provide a destination." },
        { status: 400 }
      );
    }

    const parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 14) {
      return NextResponse.json(
        { success: false, message: "Trip duration must be between 1 and 14 days." },
        { status: 400 }
      );
    }

    const parsedBudget = parseFloat(budget);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid budget amount greater than 0." },
        { status: 400 }
      );
    }

    const parsedTravelers = parseInt(travelers, 10);
    if (isNaN(parsedTravelers) || parsedTravelers < 1 || parsedTravelers > 20) {
      return NextResponse.json(
        { success: false, message: "Number of travelers must be between 1 and 20." },
        { status: 400 }
      );
    }

    // 4. Connect Database & Fetch Grounding Data
    await connectToDatabase();

    const destQuery = destination.trim();
    // Case-insensitive matching by name or slug
    const foundDestination = await Destination.findOne({
      $or: [
        { name: { $regex: destQuery, $options: "i" } },
        { slug: { $regex: destQuery.toLowerCase().replace(/\s+/g, "-"), $options: "i" } },
        { country: { $regex: destQuery, $options: "i" } },
      ],
    }).lean();

    if (!foundDestination) {
      return NextResponse.json(
        {
          success: false,
          message: `Destination "${destQuery}" is not currently in Travellow's database. Please search for supported destinations such as Kerala, Goa, Jaipur, Bali, Kyoto, Paris, or Swiss Alps.`,
        },
        { status: 404 }
      );
    }

    // Fetch related hotels and guides for grounding
    const hotels = await Hotel.find({ destination: foundDestination._id }).lean();
    const guides = await Guide.find({ destination: foundDestination._id }).lean();

    // 5. Generate Plan via Gemini AI
    const aiOutput = await generateAIPlan(
      {
        destination: foundDestination.name,
        duration: parsedDuration,
        budget: parsedBudget,
        travelers: parsedTravelers,
        travelStyle: travelStyle || "Comfortable",
        interests: Array.isArray(interests) ? interests : [],
      },
      {
        destination: foundDestination,
        hotels,
        guides,
      }
    );

    // 6. Mandatory Verification & Hallucination Filtering
    const validHotelMap = new Map(hotels.map((h) => [h._id.toString(), h]));
    const validGuideMap = new Map(guides.map((g) => [g._id.toString(), g]));

    const verifiedHotels = [];
    if (Array.isArray(aiOutput.recommendedHotels)) {
      for (const item of aiOutput.recommendedHotels) {
        const hId = String(item.id || item._id || "");
        if (validHotelMap.has(hId)) {
          const dbHotel = validHotelMap.get(hId);
          verifiedHotels.push({
            ...dbHotel,
            _id: dbHotel._id.toString(),
            destination: dbHotel.destination ? dbHotel.destination.toString() : "",
            aiReason: item.reason || "Handpicked accommodation matching your travel style.",
          });
        }
      }
    }

    const verifiedGuides = [];
    if (Array.isArray(aiOutput.recommendedGuides)) {
      for (const item of aiOutput.recommendedGuides) {
        const gId = String(item.id || item._id || "");
        if (validGuideMap.has(gId)) {
          const dbGuide = validGuideMap.get(gId);
          verifiedGuides.push({
            ...dbGuide,
            _id: dbGuide._id.toString(),
            destination: dbGuide.destination ? dbGuide.destination.toString() : "",
            aiReason: item.reason || "Recommended local guide for your itinerary.",
          });
        }
      }
    }

    // 7. Store Interaction in AIChat Model
    const sessionId = `trip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    try {
      await AIChat.create({
        user: user._id || user.id,
        sessionId,
        messages: [
          {
            role: "USER",
            content: JSON.stringify({
              destination: foundDestination.name,
              duration: parsedDuration,
              budget: parsedBudget,
              travelers: parsedTravelers,
              travelStyle,
              interests,
            }),
          },
          {
            role: "ASSISTANT",
            content: JSON.stringify({
              summary: aiOutput.summary,
              recommendedHotelsCount: verifiedHotels.length,
              recommendedGuidesCount: verifiedGuides.length,
            }),
          },
        ],
      });
    } catch (dbErr) {
      console.error("Non-fatal error logging AIChat session:", dbErr.message);
    }

    // 8. Return Safe Response
    return NextResponse.json({
      success: true,
      sessionId,
      data: {
        summary: aiOutput.summary || `Personalized ${parsedDuration}-day trip to ${foundDestination.name}`,
        destination: {
          id: foundDestination._id.toString(),
          name: foundDestination.name,
          country: foundDestination.country,
          image: foundDestination.image,
          rating: foundDestination.rating,
          startingPrice: foundDestination.startingPrice,
          currency: foundDestination.currency || "INR",
        },
        duration: parsedDuration,
        estimatedBudget: aiOutput.estimatedBudget || { amount: parsedBudget, currency: "INR" },
        days: Array.isArray(aiOutput.days) ? aiOutput.days : [],
        recommendedHotels: verifiedHotels,
        recommendedGuides: verifiedGuides,
        travelTips: Array.isArray(aiOutput.travelTips) ? aiOutput.travelTips : [],
      },
    });
  } catch (error) {
    console.error("AI Trip Planner endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "An unexpected error occurred while generating your AI trip plan.",
      },
      { status: 500 }
    );
  }
}

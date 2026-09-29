import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import Destination from "@/models/Destination";
import Hotel from "@/models/Hotel";
import Guide from "@/models/Guide";
import AIChat from "@/models/AIChat";
import { getCurrentUser } from "@/lib/auth/session";
import { generateAIChatResponse } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    // 1. Authenticate User
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required. Please sign in to chat with Travellow AI.",
        },
        { status: 401 }
      );
    }

    // 2. Check Gemini API Key
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
    const { message, sessionId } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, message: "Please type a message before sending." },
        { status: 400 }
      );
    }

    const safeMessage = message.trim();
    if (safeMessage.length > 500) {
      return NextResponse.json(
        { success: false, message: "Message is too long. Maximum length is 500 characters." },
        { status: 400 }
      );
    }

    // 4. Connect Database & Load/Create AIChat Session
    await connectToDatabase();

    const userId = user._id || user.id;
    let activeSessionId = sessionId;
    let chatDoc = null;

    if (activeSessionId && typeof activeSessionId === "string") {
      chatDoc = await AIChat.findOne({
        sessionId: activeSessionId,
        user: userId,
      });
    }

    if (!chatDoc) {
      activeSessionId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      chatDoc = new AIChat({
        user: userId,
        sessionId: activeSessionId,
        messages: [],
      });
    }

    const ownGuide = await Guide.findOne({ user: userId }).select("_id").lean();
    const guideQuery = ownGuide ? { _id: { $ne: ownGuide._id } } : { user: { $ne: userId } };

    // 5. Query Database Grounding Context (in parallel with field projections for maximum performance)
    const [destinations, hotels, guides] = await Promise.all([
      Destination.find()
        .select("name country region description bestTimeToVisit activities highlights startingPrice currency")
        .lean(),
      Hotel.find()
        .select("name rating pricePerNight currency amenities description destination")
        .populate("destination", "name")
        .lean(),
      Guide.find(guideQuery)
        .select("name rating hourlyRate currency languages specialties experienceYears destination")
        .populate("destination", "name")
        .lean(),
    ]);

    // 6. Build History & Call Gemini AI
    const existingMessages = chatDoc.messages || [];
    const conversationPayload = [
      ...existingMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: "USER", content: safeMessage },
    ];

    const aiOutput = await generateAIChatResponse(conversationPayload, {
      destinations,
      hotels,
      guides,
    });

    // 7. Mandatory Verification & Hallucination Filtering
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
            destination: dbHotel.destination
              ? typeof dbHotel.destination === "object"
                ? dbHotel.destination._id.toString()
                : dbHotel.destination.toString()
              : "",
            aiReason: item.reason || "Recommended accommodation based on your question.",
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
            destination: dbGuide.destination
              ? typeof dbGuide.destination === "object"
                ? dbGuide.destination._id.toString()
                : dbGuide.destination.toString()
              : "",
            aiReason: item.reason || "Recommended local guide for your query.",
          });
        }
      }
    }

    const assistantReplyText =
      aiOutput.reply || "I am happy to assist you with your travel questions about Travellow!";

    // 8. Save Conversation Messages to MongoDB AIChat
    chatDoc.messages.push({
      role: "USER",
      content: safeMessage,
      timestamp: new Date(),
    });
    chatDoc.messages.push({
      role: "ASSISTANT",
      content: assistantReplyText,
      timestamp: new Date(),
    });

    await chatDoc.save();

    // 9. Return Response
    return NextResponse.json({
      success: true,
      sessionId: activeSessionId,
      message: {
        role: "ASSISTANT",
        content: assistantReplyText,
      },
      recommendedHotels: verifiedHotels,
      recommendedGuides: verifiedGuides,
    });
  } catch (error) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "An unexpected error occurred while processing your chat message.",
      },
      { status: 500 }
    );
  }
}

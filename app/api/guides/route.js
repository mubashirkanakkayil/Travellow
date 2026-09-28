import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import Guide from "@/models/Guide";
import Destination from "@/models/Destination"; // Imported to register schema for populate

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await connectToDatabase();
    const currentUser = await getCurrentUser(request);

    const { searchParams } = new URL(request.url);
    const destinationFilter = searchParams.get("destination");
    const search = searchParams.get("search");

    const query = {};

    // Exclude currently authenticated user's own guide record from customer discovery
    if (currentUser) {
      query.user = { $ne: currentUser.id };
    }

    // Filter by destination ID or slug
    if (destinationFilter) {
      if (destinationFilter.match(/^[0-9a-fA-F]{24}$/)) {
        query.destination = destinationFilter;
      } else {
        const destDoc = await Destination.findOne({ slug: destinationFilter }).lean();
        if (destDoc) {
          query.destination = destDoc._id;
        }
      }
    }

    // Search query across name, country, bio
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { country: new RegExp(search, "i") },
        { bio: new RegExp(search, "i") },
      ];
    }

    const guides = await Guide.find(query)
      .select("name destination country bio profileImage languages specialties rating reviewCount hourlyRate currency verified experienceYears")
      .populate("destination", "name country slug region")
      .sort({ rating: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: guides.length,
      data: guides,
    });
  } catch (error) {
    console.error("GET /api/guides Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch guides",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

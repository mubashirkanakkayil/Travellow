import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import Hotel from "@/models/Hotel";
import Destination from "@/models/Destination"; // Imported to register schema for populate

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const destinationFilter = searchParams.get("destination");
    const search = searchParams.get("search");

    const query = {};

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

    // Search query across name, location/country, description
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { country: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
      ];
    }

    const hotels = await Hotel.find(query)
      .populate("destination", "name country slug region")
      .sort({ rating: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: hotels.length,
      data: hotels,
    });
  } catch (error) {
    console.error("GET /api/hotels Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch hotels",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

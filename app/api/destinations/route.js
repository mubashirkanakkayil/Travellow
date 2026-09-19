import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import Destination from "@/models/Destination";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const country = searchParams.get("country");
    const search = searchParams.get("search");

    const query = {};

    // Filter by Region (INDIA, ASIA, EUROPE)
    if (region && region !== "ALL") {
      query.region = region.toUpperCase();
    }

    // Filter by Country
    if (country) {
      query.country = new RegExp(country, "i");
    }

    // Search query across name, country, shortDescription
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { country: new RegExp(search, "i") },
        { shortDescription: new RegExp(search, "i") },
      ];
    }

    const destinations = await Destination.find(query).sort({ rating: -1 });

    return NextResponse.json({
      success: true,
      count: destinations.length,
      data: destinations,
    });
  } catch (error) {
    console.error("GET /api/destinations Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch destinations",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

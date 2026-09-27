import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import Destination from "@/models/Destination";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    const { slug } = params;
    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Destination slug parameter is required" },
        { status: 400 }
      );
    }

    const querySlug = slug.toLowerCase();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);

    let destination = await Destination.findOne({
      $or: [
        { slug: querySlug },
        ...(isObjectId ? [{ _id: slug }] : []),
      ],
    }).lean();

    if (!destination) {
      return NextResponse.json(
        { success: false, message: "Destination not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: destination,
    });
  } catch (error) {
    console.error("GET /api/destinations/[slug] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch destination details",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

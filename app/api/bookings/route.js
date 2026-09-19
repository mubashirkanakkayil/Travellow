import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import Booking from "@/models/Booking";
import Hotel from "@/models/Hotel";
import Guide from "@/models/Guide";
import Destination from "@/models/Destination";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * POST /api/bookings
 * Create a new hotel or guide booking for the authenticated user
 */
export async function POST(request) {
  try {
    // 1. Authenticate user from session
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required to create a booking." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingType, hotelId, guideId, startDate, endDate, hours, guests } = body;

    // 2. Validate bookingType
    if (!bookingType || !["HOTEL", "GUIDE"].includes(bookingType)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing bookingType. Must be HOTEL or GUIDE." },
        { status: 400 }
      );
    }

    // 3. Validate guests
    const parsedGuests = Number(guests);
    if (isNaN(parsedGuests) || parsedGuests < 1 || !Number.isInteger(parsedGuests)) {
      return NextResponse.json(
        { success: false, message: "Guests must be a positive integer greater than or equal to 1." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 4. Handle HOTEL Booking
    if (bookingType === "HOTEL") {
      if (!hotelId || !OBJECT_ID_REGEX.test(hotelId)) {
        return NextResponse.json(
          { success: false, message: "Valid hotelId ObjectId is required for HOTEL bookings." },
          { status: 400 }
        );
      }

      if (!startDate || !endDate) {
        return NextResponse.json(
          { success: false, message: "Both startDate and endDate are required for HOTEL bookings." },
          { status: 400 }
        );
      }

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return NextResponse.json(
          { success: false, message: "Invalid startDate or endDate format." },
          { status: 400 }
        );
      }

      if (endDateObj <= startDateObj) {
        return NextResponse.json(
          { success: false, message: "End date must be strictly after start date." },
          { status: 400 }
        );
      }

      // Fetch hotel document from DB
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return NextResponse.json(
          { success: false, message: "Hotel not found." },
          { status: 404 }
        );
      }

      // Calculate nights on server
      const diffTime = endDateObj.getTime() - startDateObj.getTime();
      const numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (numberOfNights < 1) {
        return NextResponse.json(
          { success: false, message: "Hotel booking must be for at least 1 night." },
          { status: 400 }
        );
      }

      // Calculate totalAmount using MongoDB hotel pricePerNight
      const pricePerNight = hotel.pricePerNight;
      const currency = hotel.currency || "INR";
      const totalAmount = pricePerNight * numberOfNights;

      const newBooking = await Booking.create({
        user: user.id,
        bookingType: "HOTEL",
        hotel: hotel._id,
        destination: hotel.destination,
        startDate: startDateObj,
        endDate: endDateObj,
        guests: parsedGuests,
        totalAmount,
        currency,
        status: "PENDING",
      });

      return NextResponse.json(
        {
          success: true,
          message: "Hotel booking created successfully.",
          data: newBooking,
        },
        { status: 201 }
      );
    }

    // 5. Handle GUIDE Booking
    if (bookingType === "GUIDE") {
      if (!guideId || !OBJECT_ID_REGEX.test(guideId)) {
        return NextResponse.json(
          { success: false, message: "Valid guideId ObjectId is required for GUIDE bookings." },
          { status: 400 }
        );
      }

      if (!startDate) {
        return NextResponse.json(
          { success: false, message: "startDate is required for GUIDE bookings." },
          { status: 400 }
        );
      }

      const startDateObj = new Date(startDate);
      if (isNaN(startDateObj.getTime())) {
        return NextResponse.json(
          { success: false, message: "Invalid startDate format." },
          { status: 400 }
        );
      }

      const parsedHours = Number(hours);
      if (isNaN(parsedHours) || parsedHours < 1 || !Number.isInteger(parsedHours)) {
        return NextResponse.json(
          { success: false, message: "Hours must be a positive integer greater than or equal to 1." },
          { status: 400 }
        );
      }

      // Fetch guide document from DB
      const guide = await Guide.findById(guideId);
      if (!guide) {
        return NextResponse.json(
          { success: false, message: "Local guide not found." },
          { status: 404 }
        );
      }

      // Calculate totalAmount using MongoDB guide hourlyRate
      const hourlyRate = guide.hourlyRate;
      const currency = guide.currency || "INR";
      const totalAmount = hourlyRate * parsedHours;

      const newBooking = await Booking.create({
        user: user.id,
        bookingType: "GUIDE",
        guide: guide._id,
        destination: guide.destination,
        startDate: startDateObj,
        endDate: endDate ? new Date(endDate) : null,
        hours: parsedHours,
        guests: parsedGuests,
        totalAmount,
        currency,
        status: "PENDING",
      });

      return NextResponse.json(
        {
          success: true,
          message: "Guide booking created successfully.",
          data: newBooking,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("POST /api/bookings Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create booking. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings
 * Retrieve all bookings for the currently authenticated user
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required to view bookings." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Import Destination model to ensure schema registration for populate
    if (!Destination) console.log("Destination registered");

    const bookings = await Booking.find({ user: user.id })
      .populate("hotel", "name image pricePerNight currency rating address")
      .populate("guide", "name profileImage hourlyRate currency rating languages")
      .populate("destination", "name country region slug image")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("GET /api/bookings Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user bookings." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import GuideApplication from "@/models/GuideApplication";
import Destination from "@/models/Destination";

export const dynamic = "force-dynamic";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * POST /api/guide-applications
 * Submit a new local guide application for authenticated USER accounts
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to submit guide application." },
        { status: 401 }
      );
    }

    if (user.role !== "USER") {
      return NextResponse.json(
        {
          success: false,
          error:
            user.role === "LOCAL_GUIDE"
              ? "You are already a registered Local Guide."
              : "Administrators cannot submit guide applications.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      phone,
      country,
      destination,
      profileImage,
      profileImageMetadata,
      verificationDocuments,
      languages,
      specialties,
      experienceYears,
      bio,
      hourlyRate,
      currency,
      availability,
      motivation,
    } = body;

    // Validate required text fields
    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!destination || !OBJECT_ID_REGEX.test(destination)) {
      return NextResponse.json(
        { success: false, error: "A valid target destination selection is required." },
        { status: 400 }
      );
    }

    if (!bio || !bio.trim()) {
      return NextResponse.json(
        { success: false, error: "Short bio is required." },
        { status: 400 }
      );
    }

    if (!motivation || !motivation.trim()) {
      return NextResponse.json(
        { success: false, error: "Application motivation statement is required." },
        { status: 400 }
      );
    }

    // Server-side Profile Photo Validation
    const profilePhotoUrl =
      typeof profileImage === "string"
        ? profileImage
        : profileImage?.secureUrl || profileImageMetadata?.secureUrl;

    if (!profilePhotoUrl || !profilePhotoUrl.trim()) {
      return NextResponse.json(
        { success: false, error: "Profile photo is required." },
        { status: 400 }
      );
    }

    // Process & Validate Verification Documents
    const formattedDocs = Array.isArray(verificationDocuments)
      ? verificationDocuments
          .filter((doc) => doc && doc.type && doc.secureUrl)
          .map((doc) => ({
            type: doc.type,
            fileName: doc.fileName || doc.filename || "document",
            publicId: doc.publicId || "",
            secureUrl: doc.secureUrl,
            resourceType: doc.resourceType || "image",
            fileSize: Number(doc.fileSize || 0),
            status: "PENDING",
            uploadedAt: new Date(),
          }))
      : [];

    const hasGovId = formattedDocs.some(
      (doc) => doc.type === "GOVERNMENT_ID" && doc.secureUrl
    );

    if (!hasGovId) {
      return NextResponse.json(
        {
          success: false,
          error: "Government ID document is required for identity verification.",
        },
        { status: 400 }
      );
    }

    const parsedRate = Number(hourlyRate);
    if (isNaN(parsedRate) || parsedRate < 0) {
      return NextResponse.json(
        { success: false, error: "Hourly rate must be a non-negative number." },
        { status: 400 }
      );
    }

    const parsedExp = Number(experienceYears || 0);
    if (isNaN(parsedExp) || parsedExp < 0) {
      return NextResponse.json(
        { success: false, error: "Years of experience must be a non-negative number." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify Destination exists in DB
    const destDoc = await Destination.findById(destination);
    if (!destDoc) {
      return NextResponse.json(
        { success: false, error: "Selected destination does not exist." },
        { status: 404 }
      );
    }

    // Check for existing PENDING application from this user
    const existingPending = await GuideApplication.findOne({
      user: user.id,
      status: "PENDING",
    });

    if (existingPending) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a guide application currently pending admin review.",
        },
        { status: 409 }
      );
    }

    // Process languages and specialties arrays
    const parsedLanguages = Array.isArray(languages)
      ? languages.map((l) => String(l).trim()).filter(Boolean)
      : typeof languages === "string"
      ? languages.split(",").map((l) => l.trim()).filter(Boolean)
      : ["English"];

    const parsedSpecialties = Array.isArray(specialties)
      ? specialties.map((s) => String(s).trim()).filter(Boolean)
      : typeof specialties === "string"
      ? specialties.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const validCurrency = ["INR", "USD", "AED", "EUR", "GBP", "JPY"].includes(currency)
      ? currency
      : "INR";

    const profileMeta =
      typeof profileImage === "object"
        ? profileImage
        : profileImageMetadata || { secureUrl: profilePhotoUrl };

    // Create application with server-enforced PENDING status
    const newApp = await GuideApplication.create({
      user: user.id,
      fullName: fullName.trim(),
      email: user.email.toLowerCase().trim(),
      phone: (phone || user.phone || "").trim(),
      country: (country || user.country || destDoc.country || "India").trim(),
      destination: destDoc._id,
      profileImage: profilePhotoUrl.trim(),
      profileImageMetadata: {
        publicId: profileMeta.publicId || "",
        secureUrl: profilePhotoUrl.trim(),
        fileName: profileMeta.fileName || "",
        resourceType: profileMeta.resourceType || "image",
      },
      verificationDocuments: formattedDocs,
      languages: parsedLanguages.length > 0 ? parsedLanguages : ["English"],
      specialties: parsedSpecialties,
      experienceYears: parsedExp,
      bio: bio.trim(),
      hourlyRate: parsedRate,
      currency: validCurrency,
      availability: (availability || "Flexible").trim(),
      motivation: motivation.trim(),
      status: "PENDING", // Server controlled
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your guide application has been submitted successfully.",
        data: newApp,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/guide-applications Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit guide application." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/guide-applications
 * Fetch authenticated user's guide applications
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const applications = await GuideApplication.find({ user: user.id })
      .sort({ createdAt: -1 })
      .populate("destination", "name country image slug")
      .lean();

    return NextResponse.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error("GET /api/guide-applications Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch guide applications." },
      { status: 500 }
    );
  }
}

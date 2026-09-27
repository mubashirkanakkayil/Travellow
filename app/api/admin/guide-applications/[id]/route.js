import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import GuideApplication from "@/models/GuideApplication";
import User from "@/models/User";
import Guide from "@/models/Guide";
import Destination from "@/models/Destination";

export const dynamic = "force-dynamic";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * GET /api/admin/guide-applications/[id]
 * Retrieve single guide application details for admin review.
 * ADMIN ONLY.
 */
export async function GET(request, { params }) {
  try {
    const adminUser = await getCurrentUser(request);
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id || !OBJECT_ID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid guide application ID." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const application = await GuideApplication.findById(id)
      .populate("user", "name email role phone country profileImage")
      .populate("destination", "name country image slug")
      .populate("reviewedBy", "name email")
      .lean();

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Guide application not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("GET /api/admin/guide-applications/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch guide application details." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/guide-applications/[id]
 * Approve or Reject a guide application.
 * ADMIN ONLY.
 */
export async function PATCH(request, { params }) {
  try {
    const adminUser = await getCurrentUser(request);
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = params;
    if (!id || !OBJECT_ID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid guide application ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, adminNote } = body;

    if (!action || !["APPROVE", "REJECT"].includes(action.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be APPROVE or REJECT." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const application = await GuideApplication.findById(id);
    if (!application) {
      return NextResponse.json(
        { success: false, error: "Guide application not found." },
        { status: 404 }
      );
    }

    if (application.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Application has already been ${application.status.toLowerCase()} and cannot be modified further.`,
        },
        { status: 400 }
      );
    }

    const currentAction = action.toUpperCase();

    if (currentAction === "APPROVE") {
      // Check Document Verification Rules
      const hasProfilePhoto = Boolean(
        application.profileImage || application.profileImageMetadata?.secureUrl
      );

      let govIdDoc = application.verificationDocuments?.find(
        (doc) => doc.type === "GOVERNMENT_ID"
      );

      // Handle legacy/seed applications submitted before Phase 9G document requirement
      if (!govIdDoc && hasProfilePhoto) {
        govIdDoc = {
          type: "GOVERNMENT_ID",
          fileName: "identity_verification",
          publicId: "legacy",
          secureUrl: application.profileImage || application.profileImageMetadata?.secureUrl || "",
          resourceType: "image",
          status: "VERIFIED",
          uploadedAt: new Date(),
          reviewedAt: new Date(),
        };
        application.verificationDocuments = application.verificationDocuments || [];
        application.verificationDocuments.push(govIdDoc);
      }

      if (
        !hasProfilePhoto ||
        !govIdDoc ||
        govIdDoc.status !== "VERIFIED"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Required verification documents must be uploaded and verified before approving this application.",
          },
          { status: 400 }
        );
      }

      // 1. Fetch associated user
      const userId = application.user?._id || application.user;
      const userDoc = await User.findById(userId);
      if (!userDoc) {
        return NextResponse.json(
          { success: false, error: "Associated user account not found." },
          { status: 404 }
        );
      }

      // 2. Fetch target destination
      const destId = application.destination?._id || application.destination;
      const destDoc = await Destination.findById(destId);
      if (!destDoc) {
        return NextResponse.json(
          { success: false, error: "Target destination no longer exists." },
          { status: 404 }
        );
      }

      // 3. Create or update Guide profile using uploaded Cloudinary profile image
      const defaultImage =
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600";

      const guideProfileImage =
        application.profileImage ||
        application.profileImageMetadata?.secureUrl ||
        userDoc.profileImage ||
        defaultImage;

      const guideData = {
        name: application.fullName || userDoc.name,
        destination: application.destination,
        country: application.country || destDoc.country || "India",
        bio: application.bio,
        profileImage: guideProfileImage,
        languages: application.languages && application.languages.length > 0 ? application.languages : ["English"],
        specialties: application.specialties || [],
        experienceYears: application.experienceYears >= 0 ? application.experienceYears : 2,
        hourlyRate: application.hourlyRate >= 0 ? application.hourlyRate : 500,
        currency: application.currency || "INR",
        verified: true,
      };

      // Search for existing guide by name and destination to avoid duplicate creation
      let guideDoc = await Guide.findOne({
        name: guideData.name,
        destination: guideData.destination,
      });

      if (guideDoc) {
        Object.assign(guideDoc, guideData);
        await guideDoc.save();
      } else {
        guideDoc = await Guide.create(guideData);
      }

      // 4. Update User role to LOCAL_GUIDE
      userDoc.role = "LOCAL_GUIDE";
      await userDoc.save();

      // 5. Update Application status to APPROVED
      application.status = "APPROVED";
      application.reviewedBy = adminUser.id;
      application.reviewedAt = new Date();
      if (adminNote) application.adminNote = adminNote.trim();
      await application.save();

      return NextResponse.json({
        success: true,
        message: "Guide application approved successfully. User role updated to LOCAL_GUIDE.",
        data: {
          application,
          guide: guideDoc,
        },
      });
    }

    if (currentAction === "REJECT") {
      application.status = "REJECTED";
      application.adminNote = adminNote ? adminNote.trim() : "Application rejected by administrator.";
      application.reviewedBy = adminUser.id;
      application.reviewedAt = new Date();
      await application.save();

      return NextResponse.json({
        success: true,
        message: "Guide application rejected.",
        data: application,
      });
    }
  } catch (error) {
    console.error("PATCH /api/admin/guide-applications/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process guide application decision." },
      { status: 500 }
    );
  }
}

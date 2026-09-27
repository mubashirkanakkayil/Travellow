import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { getCurrentUser } from "@/lib/auth/session";
import GuideApplication from "@/models/GuideApplication";

export const dynamic = "force-dynamic";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * PATCH /api/admin/guide-applications/[id]/documents
 * Admin route to verify or reject individual guide application verification documents.
 * ADMIN ONLY.
 */
export async function PATCH(request, { params }) {
  try {
    const adminUser = await getCurrentUser();
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
    const { documentType, documentId, status, action, adminNote } = body;

    const targetAction = (status || action || "").toUpperCase();
    if (!["VERIFY", "VERIFIED", "REJECT", "REJECTED"].includes(targetAction)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid document verification status. Must be VERIFY/VERIFIED or REJECT/REJECTED.",
        },
        { status: 400 }
      );
    }

    const newStatus = targetAction.includes("VERIFY") ? "VERIFIED" : "REJECTED";

    await connectToDatabase();

    const application = await GuideApplication.findById(id);
    if (!application) {
      return NextResponse.json(
        { success: false, error: "Guide application not found." },
        { status: 404 }
      );
    }

    // Locate target document inside verificationDocuments array
    let docIndex = -1;
    if (documentId && OBJECT_ID_REGEX.test(documentId)) {
      docIndex = application.verificationDocuments.findIndex(
        (doc) => doc._id && doc._id.toString() === documentId
      );
    }

    if (docIndex === -1 && documentType) {
      docIndex = application.verificationDocuments.findIndex(
        (doc) => doc.type === documentType
      );
    }

    if (docIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Specified document not found in application." },
        { status: 404 }
      );
    }

    // Update target document
    application.verificationDocuments[docIndex].status = newStatus;
    application.verificationDocuments[docIndex].reviewedAt = new Date();
    if (adminNote !== undefined) {
      application.verificationDocuments[docIndex].adminNote = String(adminNote).trim();
    }

    await application.save();

    return NextResponse.json({
      success: true,
      message: `Document status updated to ${newStatus}.`,
      data: application,
    });
  } catch (error) {
    console.error("PATCH /api/admin/guide-applications/[id]/documents Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update document verification status." },
      { status: 500 }
    );
  }
}

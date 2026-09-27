import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import cloudinary, { generateUploadSignature } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

const ALLOWED_PROFILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const ALLOWED_DOCUMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "application/pdf",
];

const MAX_PROFILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    // A. Handle Multipart FormData Upload directly on Server
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const category = formData.get("category") || "document"; // "profile" | "document"

      if (!file || typeof file === "string") {
        return NextResponse.json(
          { success: false, error: "No file uploaded." },
          { status: 400 }
        );
      }

      // Validate File Size & MIME Type
      const mimeType = file.type?.toLowerCase() || "";
      const fileSize = file.size || 0;
      const fileName = file.name || "uploaded_file";

      if (category === "profile") {
        if (!ALLOWED_PROFILE_TYPES.includes(mimeType)) {
          return NextResponse.json(
            {
              success: false,
              error: "Profile photo must be JPG, JPEG, PNG, or WEBP format.",
            },
            { status: 400 }
          );
        }
        if (fileSize > MAX_PROFILE_SIZE) {
          return NextResponse.json(
            { success: false, error: "Profile photo must be less than 5 MB." },
            { status: 400 }
          );
        }
      } else {
        if (!ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Verification document must be PDF, JPG, JPEG, PNG, or WEBP format.",
            },
            { status: 400 }
          );
        }
        if (fileSize > MAX_DOCUMENT_SIZE) {
          return NextResponse.json(
            {
              success: false,
              error: "Verification document must be less than 10 MB.",
            },
            { status: 400 }
          );
        }
      }

      // Upload to Cloudinary via server SDK
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const folder =
        category === "profile"
          ? "travellow/guide-profiles"
          : "travellow/guide-documents";

      const resourceType = mimeType === "application/pdf" ? "raw" : "auto";

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || "travellow_guides",
          },
          (err, res) => {
            if (err) reject(err);
            else resolve(res);
          }
        );
        stream.end(buffer);
      });

      return NextResponse.json({
        success: true,
        data: {
          secureUrl: result.secure_url,
          publicId: result.public_id,
          fileName,
          resourceType: result.resource_type || (mimeType === "application/pdf" ? "pdf" : "image"),
          fileSize,
        },
      });
    }

    // B. Handle JSON Signature Generation for Client-Side Cloudinary Upload
    const body = await request.json();
    const { category = "document", fileType = "", fileSize = 0 } = body;

    if (category === "profile") {
      if (fileType && !ALLOWED_PROFILE_TYPES.includes(fileType.toLowerCase())) {
        return NextResponse.json(
          {
            success: false,
            error: "Profile photo must be JPG, JPEG, PNG, or WEBP format.",
          },
          { status: 400 }
        );
      }
      if (fileSize && fileSize > MAX_PROFILE_SIZE) {
        return NextResponse.json(
          { success: false, error: "Profile photo must be less than 5 MB." },
          { status: 400 }
        );
      }
    } else {
      if (fileType && !ALLOWED_DOCUMENT_TYPES.includes(fileType.toLowerCase())) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Verification document must be PDF, JPG, JPEG, PNG, or WEBP format.",
          },
          { status: 400 }
        );
      }
      if (fileSize && fileSize > MAX_DOCUMENT_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: "Verification document must be less than 10 MB.",
          },
          { status: 400 }
        );
      }
    }

    const folder =
      category === "profile"
        ? "travellow/guide-profiles"
        : "travellow/guide-documents";

    const signatureData = generateUploadSignature({
      folder,
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || "travellow_guides",
    });

    return NextResponse.json({
      success: true,
      data: signatureData,
    });
  } catch (error) {
    console.error("POST /api/guide-applications/upload-signature error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed or invalid request." },
      { status: 500 }
    );
  }
}

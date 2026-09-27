import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn("Cloudinary environment variables are missing in server environment.");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export default cloudinary;

/**
 * Generate a signed upload signature for direct browser-to-Cloudinary upload.
 * Folder logic:
 * - Profile photo: "travellow/guide-profiles"
 * - Verification document: "travellow/guide-documents"
 */
export function generateUploadSignature({ folder, uploadPreset, tags, resourceType = "auto" }) {
  const timestamp = Math.floor(Date.now() / 1000);
  
  const paramsToSign = {
    timestamp,
    folder: folder || "travellow/guide-documents",
  };

  if (uploadPreset) {
    paramsToSign.upload_preset = uploadPreset;
  }

  if (tags) {
    paramsToSign.tags = Array.isArray(tags) ? tags.join(",") : tags;
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    apiSecret
  );

  return {
    signature,
    timestamp,
    cloudName,
    apiKey,
    folder: paramsToSign.folder,
    uploadPreset: paramsToSign.upload_preset,
  };
}

/**
 * Server-side upload helper if buffer/dataURI is provided directly.
 */
export async function uploadStream(fileBuffer, { folder, resourceType = "auto", publicId }) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder || "travellow/guide-documents",
        resource_type: resourceType,
        public_id: publicId,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

import mongoose from "mongoose";

const GuideApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "India",
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      required: [true, "Target destination is required"],
      index: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    profileImageMetadata: {
      publicId: { type: String, default: "" },
      secureUrl: { type: String, default: "" },
      fileName: { type: String, default: "" },
      resourceType: { type: String, default: "image" },
    },
    verificationDocuments: [
      {
        type: {
          type: String,
          enum: [
            "GOVERNMENT_ID",
            "EXPERIENCE_CERTIFICATE",
            "TOURISM_CERTIFICATE",
            "GUIDE_LICENSE",
            "LANGUAGE_CERTIFICATE",
            "OTHER",
          ],
          required: true,
        },
        fileName: { type: String, default: "" },
        publicId: { type: String, required: true },
        secureUrl: { type: String, required: true },
        resourceType: { type: String, default: "image" },
        fileSize: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ["PENDING", "VERIFIED", "REJECTED"],
          default: "PENDING",
        },
        adminNote: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
        reviewedAt: { type: Date },
      },
    ],
    languages: {
      type: [String],
      default: ["English"],
    },
    specialties: {
      type: [String],
      default: [],
    },
    experienceYears: {
      type: Number,
      min: [0, "Experience years cannot be negative"],
      default: 0,
    },
    bio: {
      type: String,
      required: [true, "Bio is required"],
    },
    hourlyRate: {
      type: Number,
      min: [0, "Hourly rate cannot be negative"],
      required: [true, "Hourly rate is required"],
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "AED", "EUR", "GBP", "JPY"],
      default: "INR",
    },
    availability: {
      type: String,
      default: "Flexible",
    },
    motivation: {
      type: String,
      required: [true, "Motivation is required"],
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    adminNote: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.GuideApplication ||
  mongoose.model("GuideApplication", GuideApplicationSchema);

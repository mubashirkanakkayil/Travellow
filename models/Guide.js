import mongoose from "mongoose";

const GuideSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Guide name is required"],
      trim: true,
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      required: [true, "Destination reference is required"],
      index: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    bio: {
      type: String,
      required: [true, "Guide bio is required"],
    },
    profileImage: {
      type: String,
      required: [true, "Profile image is required"],
    },
    languages: {
      type: [String],
      default: ["English"],
    },
    specialties: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.9,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      min: 0,
      required: [true, "Hourly rate is required"],
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "AED", "EUR", "GBP", "JPY"],
      default: "INR",
    },
    verified: {
      type: Boolean,
      default: true,
    },
    experienceYears: {
      type: Number,
      min: 0,
      default: 3,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Guide || mongoose.model("Guide", GuideSchema);

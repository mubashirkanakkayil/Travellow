import mongoose from "mongoose";

const DestinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Destination name is required"],
      trim: true,
      index: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      index: true,
    },
    region: {
      type: String,
      enum: ["INDIA", "ASIA", "EUROPE"],
      required: [true, "Region is required"],
      index: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
    },
    image: {
      type: String,
      required: [true, "Destination image is required"],
    },
    gallery: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.8,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    startingPrice: {
      type: Number,
      min: 0,
      required: [true, "Starting price is required"],
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "AED", "EUR", "GBP", "JPY"],
      default: "INR",
    },
    bestTimeToVisit: {
      type: String,
      default: "",
    },
    activities: {
      type: [String],
      default: [],
    },
    highlights: {
      type: [String],
      default: [],
    },
    latitude: {
      type: Number,
      default: 0,
    },
    longitude: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Destination ||
  mongoose.model("Destination", DestinationSchema);

import mongoose from "mongoose";

const HotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
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
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    image: {
      type: String,
      required: [true, "Hotel image is required"],
    },
    gallery: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.5,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    pricePerNight: {
      type: Number,
      min: 0,
      required: [true, "Price per night is required"],
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "AED", "EUR", "GBP", "JPY"],
      default: "INR",
    },
    amenities: {
      type: [String],
      default: [],
    },
    address: {
      type: String,
      default: "",
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
    aiEligible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Hotel || mongoose.model("Hotel", HotelSchema);

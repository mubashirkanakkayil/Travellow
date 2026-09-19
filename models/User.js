import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    phone: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN", "LOCAL_GUIDE"],
      default: "USER",
    },
    country: {
      type: String,
      default: "India",
    },
    preferredCurrency: {
      type: String,
      enum: ["INR", "USD", "AED", "EUR", "GBP", "JPY"],
      default: "INR",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);

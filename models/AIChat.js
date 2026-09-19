import mongoose from "mongoose";

const AIChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
      index: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["USER", "ASSISTANT"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.AIChat || mongoose.model("AIChat", AIChatSchema);

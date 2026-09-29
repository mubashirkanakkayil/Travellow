import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not set in environment.");
  process.exit(1);
}

// Inline schemas for standalone migration execution
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    role: String,
  },
  { timestamps: true }
);

const GuideSchema = new mongoose.Schema(
  {
    name: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: "Destination" },
  },
  { timestamps: true }
);

const GuideApplicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fullName: String,
    status: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Guide = mongoose.models.Guide || mongoose.model("Guide", GuideSchema);
const GuideApplication =
  mongoose.models.GuideApplication || mongoose.model("GuideApplication", GuideApplicationSchema);

async function migrateGuideOwnership() {
  try {
    console.log("Connecting to MongoDB Atlas for guide ownership migration...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    const allGuides = await Guide.find().lean();
    const totalGuidesCount = allGuides.length;

    console.log(`Total Guide documents found: ${totalGuidesCount}`);

    let alreadyLinkedCount = 0;
    let unlinkedCount = 0;
    let newlyLinkedCount = 0;
    let unresolvedCount = 0;

    const unlinkedGuides = [];

    for (const guide of allGuides) {
      if (guide.user) {
        alreadyLinkedCount++;
      } else {
        unlinkedCount++;
        unlinkedGuides.push(guide);
      }
    }

    console.log(`Already linked guides: ${alreadyLinkedCount}`);
    console.log(`Unlinked guides (user is null/missing): ${unlinkedCount}`);

    // Try linking unlinked guides based on explicit GuideApplication or User with LOCAL_GUIDE role
    for (const guide of unlinkedGuides) {
      // 1. Check if there is an approved GuideApplication matching guide's name
      let matchingApp = await GuideApplication.findOne({
        fullName: new RegExp(`^${guide.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
        status: "APPROVED",
      }).lean();

      let targetUserId = matchingApp ? matchingApp.user : null;

      // 2. If no application, check if there is a User with role LOCAL_GUIDE matching guide's name
      if (!targetUserId) {
        let matchingUser = await User.findOne({
          name: new RegExp(`^${guide.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
          role: "LOCAL_GUIDE",
        }).lean();

        if (matchingUser) {
          targetUserId = matchingUser._id;
        }
      }

      if (targetUserId) {
        await Guide.findByIdAndUpdate(guide._id, { user: targetUserId });
        newlyLinkedCount++;
        console.log(`[MIGRATION LINKED] Guide "${guide.name}" -> User ID (${targetUserId})`);
      } else {
        unresolvedCount++;
        console.log(`[UNRESOLVED SEED GUIDE] Guide "${guide.name}" has no registered User account.`);
      }
    }

    console.log("\n==========================================");
    console.log("GUIDE OWNERSHIP MIGRATION SUMMARY");
    console.log("==========================================");
    console.log(`Total Guides: ${totalGuidesCount}`);
    console.log(`Originally Linked: ${alreadyLinkedCount}`);
    console.log(`Newly Linked by Migration: ${newlyLinkedCount}`);
    console.log(`Unresolved Seed Guides (Public only): ${unresolvedCount}`);
    console.log("==========================================\n");

    await mongoose.disconnect();
    console.log("Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateGuideOwnership();

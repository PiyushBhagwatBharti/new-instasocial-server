import mongoose from "mongoose";
import { DEFAULT_PERMISSIONS } from "../source/constants/DEFAULT_PERMISSIONS.js";
import { configDotenv } from "dotenv";
import { Permission } from "../source/models/permission.model.js";
configDotenv();

async function seedRBAC() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    let inserted = 0;
    let existed = 0;

    for (const perm of DEFAULT_PERMISSIONS) {
      const result = await Permission.updateOne(
        { key: perm.key },
        { $setOnInsert: perm },
        { upsert: true },
      );

      if (result.upsertedCount === 1) {
        inserted++;
      } else {
        existed++;
      }
    }

    console.log("✅ Permissions seeded");
    console.log(`➕ Inserted: ${inserted}`);
    console.log(`♻️ Already existed: ${existed}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ RBAC seeding failed:", error);
    process.exit(1);
  }
}

seedRBAC();

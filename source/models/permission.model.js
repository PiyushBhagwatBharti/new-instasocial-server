import mongoose from "mongoose";
const permissionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    module: { type: String, index: true },
    isActive: { type: Boolean, default: true },
    label: { type: String, trim: true },
  },
  { timestamps: true },
);


export const Permission = mongoose.model("Permission", permissionSchema);

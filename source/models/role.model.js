import mongoose from "mongoose";
import { tenantPlugin } from "../plugins/tenant.plugin.js";
 
const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
    description: { type: String, trim: true },
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roleSchema.plugin(tenantPlugin);
roleSchema.index({ name: 1, tenantId: 1 }, { unique: true });
 
export const Role = mongoose.model("Role", roleSchema);
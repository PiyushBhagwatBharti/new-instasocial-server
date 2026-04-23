// models/audit.model.js
import mongoose from "mongoose";
import { tenantPlugin } from "../plugins/tenant.plugin.js";

const auditSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    action: {
      type: String,
      required: true, // e.g. ROLE_CREATE, ROLE_UPDATE
    },

    entity: {
      type: String, // e.g. "Role", "User"
      required: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    oldValue: {
      type: Object,
      default: null,
    },

    newValue: {
      type: Object,
      default: null,
    },

    meta: {
      ip: String,
      userAgent: String,
    },
    description:{
      type:String,
    }
  },
  { timestamps: true },
);

auditSchema.plugin(tenantPlugin);

export const AuditLog = mongoose.model("AuditLog", auditSchema);

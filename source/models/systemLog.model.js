// src/models/system-log.model.js
import mongoose from "mongoose";

const systemLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["info", "warn", "error"],
      required: true,
      index: true,
    },
    service: {
      type: String,
      required: true,
      index: true,
    },
    env: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      index: true,
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },
    requestId: {
      type: String,
      default: null,
      index: true,
    },
    module: {
      type: String,
      default: null,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    url: {
      type: String,
      trim: true
    },
    method: {
      type: String,
      trim: true
    },
    stack: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index({ level: 1, createdAt: -1 });

export const SystemLogModel = mongoose.model("system_logs", systemLogSchema);
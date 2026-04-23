import mongoose from "mongoose";
import { tenantPlugin } from "../plugins/tenant.plugin.js";

const PlatformSchema = new mongoose.Schema(
  {
    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Platform Identity ───────────────────────────
    platform: {
      type: String,
      enum: ["facebook", "instagram", "linkedin", "youtube", "twitter"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "revoked", "error"],
      default: "active",
    },

    // ── Display Info (for frontend cards/dropdowns) ─
    profile: {
      name: String, // "My Brand Page" / "John Doe" / "My Channel"
      handle: String, // @handle where applicable
      avatarUrl: String, // profile picture
      profileUrl: String, // link to the page/profile
      followersCount: Number,
    },

    // ── Auth Tokens (ENCRYPTED in production) ───────
    auth: {
      accessToken: { type: String },
      refreshToken: String,
      tokenExpiresAt: Date, // crucial for knowing when to refresh
      scope: [String], // what permissions were granted
    },

    // ── Platform-Specific Data ───────────────────────
    // Flexible object — different shape per platform
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },

    // ── Health & Sync ────────────────────────────────
    lastUsedAt: Date,
    lastTokenRefreshAt: Date,
    lastErrorMessage: String,
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

// Prevent duplicate platform connection per tenant
PlatformSchema.index(
  { tenantId: 1, platform: 1, "meta.platformAccountId": 1 },
  { unique: true },
);
PlatformSchema.plugin(tenantPlugin);

export const PlatformModel = mongoose.model("Platform", PlatformSchema);

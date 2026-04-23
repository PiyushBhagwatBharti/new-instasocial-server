// models/Post.model.js
import mongoose from "mongoose";

const mediaItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // S3 URL
    type: { type: String, enum: ["image", "video"], required: true },
    key: { type: String }, // S3 key (for deletion later)
  },
  { _id: false },
);

const platformResultSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true }, // 'facebook' | 'instagram'
    success: { type: Boolean, required: true },
    postId: { type: String }, // returned by FB/IG after publish
    type: { type: String }, // 'image' | 'carousel' etc
    error: { type: String }, // if failed
    statusCode: { type: Number },
    publishedAt: { type: Date }, // when it actually went live
  },
  { _id: false },
);

const postSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ----------------------------------------
    // 📝 Content
    // ----------------------------------------
    caption: { type: String, default: "" },
    media: [mediaItemSchema], // normalized shape we agreed on
    type: {
      type: String,
      enum: ["text", "image", "video", "reel", "story", "carousel"],
      required: true,
    },

    // ----------------------------------------
    // 🎯 Targeting
    // ----------------------------------------
    platforms: {
      type: [String], // ['facebook', 'instagram']
      enum: ["facebook", "instagram"],
      required: true,
    },

    // ----------------------------------------
    // ⏰ Scheduling
    // ----------------------------------------
    scheduledAt: { type: Date, required: true, index: true },
    timezone: { type: String, default: "UTC" }, // store user's timezone

    // ----------------------------------------
    // 🔄 Status
    // ----------------------------------------
    status: {
      type: String,
      enum: [
        "draft",
        "pending",
        "processing",
        "published",
        "failed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    // ----------------------------------------
    // 📊 Results (filled by cron after publish)
    // ----------------------------------------
    results: [platformResultSchema],

    // ----------------------------------------
    // 🔁 Retry Tracking
    // ----------------------------------------
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    lastTriedAt: { type: Date },
    failureReason: { type: String }, // last top-level error if all retries fail
  },
  { timestamps: true },
);

// cron does: { status: 'pending', scheduledAt: { $lte: now } }
postSchema.index({ status: 1, scheduledAt: 1 });

export const PostModel = mongoose.model("Post", postSchema);

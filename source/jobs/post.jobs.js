// jobs/post.job.js
import { PostModel } from "../models/post.model.js";
import { PostService } from "../services/post.service.js";
import { createSocialService } from "../services/socialServices/social.service.js";
import { retry } from "../utilities/retry.js";
import { setTenantContext } from "../utilities/TenantUtils/tenantContext.js";

export const runPostJob = async () => {
  console.log(`[PostJob] Running at ${new Date().toISOString()}`);

  // ----------------------------------------
  // 1. Fetch all due pending posts
  // ----------------------------------------
  const posts = await PostModel.find({
    status: { $in: ["pending"] },
    scheduledAt: { $lte: new Date() },
  })
    .setOptions({ skipTenant: true })
    .lean();

  if (!posts.length) {
    console.log("[PostJob] No posts due.");
    return;
  }

  console.log(`[PostJob] Found ${posts.length} post(s) to publish`);

  // ----------------------------------------
  // 2. Process one by one
  // ----------------------------------------
  for (const post of posts) {
    await PostService.publishPost(post);
  }
};

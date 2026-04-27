// jobs/post.job.js
import { PostModel } from "../models/post.model.js";
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
    await processPost(post);
  }
};

const processPost = async (post) => {
  console.log(`[PostJob] Processing post: ${post._id}`);

  setTenantContext(post.tenantId, async () => {
    try {
      // ----------------------------------------
      // Step 1: flip to 'processing' immediately
      // so next cron run doesn't pick it up again
      // ----------------------------------------
      await PostModel.findByIdAndUpdate(post._id, {
        $set: {
          status: "processing",
          lastTriedAt: new Date(),
        },
      }).setOptions({ skipTenant: true });

      // ----------------------------------------
      // Step 2: publish
      // ----------------------------------------
      const SocialService = createSocialService({
        tenantId: post.tenantId,
        retry: retry,
      });

      const { results, summary } = await SocialService.publish({
        tenantId: post.tenantId,
        userId: post.userId,
        platforms: post.platforms,
        payload: {
          type: post.type,
          caption: post.caption,
          media: post.media,
        },
      });

      // ----------------------------------------
      // Step 3: determine final status
      // all failed → 'failed', all success → 'published'
      // partial → 'published' (results array tells the full story)
      // ----------------------------------------
      console.log(results);
      const allFailed = results.every((r) => !r.success);

      await PostModel.findByIdAndUpdate(post._id, {
        $set: {
          status: allFailed ? "failed" : "published",
          results: results.map((r) => ({
            ...r,
            publishedAt: r.success ? new Date() : undefined,
          })),
          ...(allFailed && {
            failureReason: results
              .map((r) => `${r.platform}: ${r.error}`)
              .join(" | "),
          }),
        },
      }).setOptions({ skipTenant: true });

      console.log(
        `[PostJob] Post ${post._id} done — ✅ ${summary.success} / ❌ ${summary.failed}`,
      );
    } catch (err) {
      // ----------------------------------------
      // Step 4: unexpected error (not per-platform)
      // e.g. DB down, SocialService itself threw
      // ----------------------------------------
      console.error(
        `[PostJob] Unexpected error for post ${post._id}:`,
        err.message,
      );

      const retryCount = post.retryCount + 1;
      const exhausted = retryCount >= post.maxRetries;

      await PostModel.findByIdAndUpdate(post._id, {
        $set: {
          // if retries exhausted → failed, else back to pending for next cron run
          status: exhausted ? "failed" : "pending",
          retryCount,
          lastTriedAt: new Date(),
          failureReason: err.message,
        },
      }).setOptions({ skipTenant: true });

      console.log(
        exhausted
          ? `[PostJob] Post ${post._id} permanently failed after ${retryCount} retries`
          : `[PostJob] Post ${post._id} will retry (${retryCount}/${post.maxRetries})`,
      );
    }
  });
};

import { PostModel } from "../models/post.model.js";
import { retry } from "../utilities/retry.js";
import { setTenantContext } from "../utilities/TenantUtils/tenantContext.js";
import { createSocialService } from "./socialServices/social.service.js";

export const PostService = {
  async publishPost(post, toRetry = true) {
    console.log(`[PostJob] Processing post: ${post._id}`);

    setTenantContext(post.tenantId, async () => {
      try {
        await PostModel.findByIdAndUpdate(post._id, {
          $set: {
            status: "processing",
            lastTriedAt: new Date(),
          },
        }).setOptions({ skipTenant: true });

        const SocialService = createSocialService({
          tenantId: post.tenantId,
          retry: toRetry ? retry : null,
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
          `[PostJob] Post ${post._id} done — posted ✅ ${summary.success} / failed ❌ ${summary.failed}`,
        );
      } catch (err) {
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
  },
};

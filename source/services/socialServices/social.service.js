// services/social.service.js
import { ApiError } from "../../utilities/asyncHandler.util.js";
import { PlatformService } from "../Platform.service.js";
import { mapPlatformToCredentials } from "./credential.mapper.js";
import { createFacebookService } from "./facebook.service.js";
import { createInstagramService } from "./instagram.services.js";

export const createSocialService = ({ tenantId, retry }) => {
  // ----------------------------------------
  // 🧠 Platform → Service Map
  // ----------------------------------------
  const serviceMap = {
    facebook: createFacebookService,
    instagram: createInstagramService,
  };

  const getService = ({ platform, credentials }) => {
    const factory = serviceMap[platform];

    if (!factory) {
      throw new ApiError(400, `Unsupported platform: ${platform}`);
    }

    return factory(credentials);
  };

  // ----------------------------------------
  // 🎯 Payload Executor
  // ----------------------------------------
  const execute = async ({ service, payload }) => {
    const map = {
      text: service.postText,
      image: service.postImage,
      video: service.postVideo,
      reel: service.postReel,
      story: service.postStory,
      carousel: service.postCarousel,
    };

    if (!payload.type) {
      throw new ApiError(400, "No platform type provided");
    }

    const fn = map[payload.type];

    if (!fn) {
      throw new ApiError(400, `Unsupported payload type: ${payload.type}`);
    }

    if (typeof fn !== "function") {
      throw new ApiError(
        400,
        `${payload.type} not supported on ${service.platform}`,
      );
    }

    // wrap with retry if provided
    if (retry) {
      return await retry(() => fn(payload));
    }
    console.log(payload);
    return await fn(payload);
  };

  const publish = async ({ tenantId, userId, platforms, payload }) => {
    if (!tenantId) throw new ApiError(400, "tenantId is required");
    if (!userId) throw new ApiError(400, "userId is required");

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      throw new ApiError(400, "platforms array is required");
    }

    if (!payload?.type) {
      throw new ApiError(400, "payload.type is required");
    }

    // remove duplicates
    const uniquePlatforms = [...new Set(platforms)];

    // --------------------------
    // ⚡ Parallel Execution
    // --------------------------
    const tasks = uniquePlatforms.map(async (platform) => {
      try {
        // 1. get credentials
        const platformDoc = await PlatformService.get(platform, tenantId);

        if (!platformDoc) {
          throw new ApiError(
            404,
            `${platformDoc} account not connected: ${platform}`,
          );
        }

        // 2. create service
        const service = getService({
          platform,
          credentials: mapPlatformToCredentials(platformDoc),
        });

        // 3. execute
        const data = await execute({ service, payload });

        return {
          platform: platformDoc,
          success: true,
          postId: data.postId,
          type: data.type,
        };
      } catch (err) {
        console.error(err);
        return {
          platform,
          success: false,
          error: err.message,
          statusCode: err.statusCode || 500,
        };
      }
    });

    const results = await Promise.all(tasks);

    // --------------------------
    // 📊 Summary (optional but useful)
    // --------------------------
    const summary = {
      total: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };

    return {
      summary,
      results,
    };
  };

  return {
    publish,
  };
};

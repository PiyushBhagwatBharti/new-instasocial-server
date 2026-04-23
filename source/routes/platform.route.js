import { Router } from "express";
import { ApiResponse, asyncHandler } from "../utilities/asyncHandler.util.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { PlatformService } from "../services/Platform.service.js";
import { createFacebookService } from "../services/socialServices/facebook.service.js";
import { createSocialService } from "../services/socialServices/social.service.js";
import { retry } from "../utilities/retry.js";

export const PlatformRouter = Router();
PlatformRouter.use(authMiddleware);

PlatformRouter.get(
  "/connect/facebook",
  asyncHandler(async (req, res) => {
    const state = JSON.stringify({
      tenantId: req.tenant?._id,
      userId: req.user?._id,
    });
    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_CLIENT_ID}&redirect_uri=${process.env.META_REDIRECT_URI}&state=${encodeURIComponent(state)}&scope=pages_manage_posts,pages_read_engagement,pages_show_list,business_management,instagram_basic,instagram_content_publish`;
    res.send({ url });
  }),
);

PlatformRouter.post("/facebook", async (req, res) => {
  const { imageUrl, caption } = req.body;
  const platform = await PlatformService.get("facebook", req.tenant._id);

  const faceBookservice = createFacebookService({
    accessToken: platform.meta.pageAccessToken,
    pageId: platform.meta.pageId,
  });

  await faceBookservice.postImage({ imageUrl, caption });
  res.send(200);
});

PlatformRouter.post(
  "/publish",
  asyncHandler(async (req, res) => {
    const { mediaUrls, caption, type = "carousel", platforms = [] } = req.body;

    const SocialService = createSocialService(
      { tenantId: req.tenant._id },
      retry,
    );
    const result = await SocialService.publish({
      payload: { mediaUrls, caption, type },
      platforms,
      userId: req.user._id,
      tenantId: req.tenant._id,
    });

    return res.status(200).json(new ApiResponse(200, result, "Posts uploaded"));
  }),
);

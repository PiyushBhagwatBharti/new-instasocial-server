import { Router } from "express";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
} from "../utilities/asyncHandler.util.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { PlatformService } from "../services/Platform.service.js";
import { createFacebookService } from "../services/socialServices/facebook.service.js";
import { createSocialService } from "../services/socialServices/social.service.js";
import { retry } from "../utilities/retry.js";
import { PlatformController } from "../controllers/Platform.controller.js";

export const PlatformRouter = Router();
PlatformRouter.use(authMiddleware);

PlatformRouter.get("/connect", PlatformController.connect);

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
    const { media, caption, type = "carousel", platforms = [] } = req.body;

    const SocialService = createSocialService(
      { tenantId: req.tenant._id },
      retry,
    );
    const result = await SocialService.publish({
      payload: { media, caption, type },
      platforms,
      userId: req.user._id,
      tenantId: req.tenant._id,
    });

    return res.status(200).json(new ApiResponse(200, result, "Posts uploaded"));
  }),
);

PlatformRouter.get("/", PlatformController.getAll);
PlatformRouter.get("/:platformId", PlatformController.getById);

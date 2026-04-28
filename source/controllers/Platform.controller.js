import { PLATFORM_MESSAGES } from "../constants/API_MESSAGES.js";
import { PlatformModel } from "../models/Platform.model.js";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
} from "../utilities/asyncHandler.util.js";
// const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=pages_manage_posts,pages_read_engagement,pages_show_list,business_management,instagram_basic,instagram_content_publish`;
// res.redirect(url);

export const PlatformController = {
  create: asyncHandler(async (req, res) => {}),
  getAll: asyncHandler(async (req, res) => {
    const platforms = await PlatformModel.find().populate("connectedBy");
    console.log("platforms", platforms.length);
    return res
      .status(200)
      .json(new ApiResponse(200, platforms, PLATFORM_MESSAGES.FETCH_SUCCESS));
  }),
  getById: asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { platformId } = req.params;

    if (!userId || !platformId) {
      throw new ApiError(404, PLATFORM_MESSAGES.UNAUTHORIZED);
    }

    const platforms = await PlatformModel.find({
      connectedBy: userId,
      _id: platformId,
    });

    if (!platforms) {
      throw new ApiError(404, PLATFORM_MESSAGES.NOT_FOUND);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, platforms, PLATFORM_MESSAGES.FETCH_SUCCESS));
  }),
  connect: asyncHandler(async (req, res) => {
      const { platform } = req.query;
      let toRedirect = req.query.toRedirect === "false" ? false : true;
  
      let url = null;
      switch (platform) {
        case "facebook":
        case "instagram":
          const state = JSON.stringify({
            tenantId: req.tenant?._id,
            userId: req.user?._id,
          });
          url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.META_CLIENT_ID}&redirect_uri=${process.env.META_REDIRECT_URI}&state=${encodeURIComponent(state)}&scope=pages_manage_posts,pages_read_engagement,pages_show_list,business_management,instagram_basic,instagram_content_publish`;
          break;
  
        default:
          throw new ApiError(400, "invaild platform");
      }
  
      if (toRedirect) {
        return res.redirect(url);
      } else {
        return res.send({ url });
      }
    }),
};

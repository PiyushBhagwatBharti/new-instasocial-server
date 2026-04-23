import { ApiError } from "../../utilities/asyncHandler.util.js";

export const mapPlatformToCredentials = (platformDoc) => {
  if (!platformDoc) {
    throw new ApiError(404, "Platform account not found");
  }

  const { platform, auth, meta } = platformDoc;

  if (!auth?.accessToken) {
    throw new ApiError(400, `${platform} accessToken missing`);
  }

  switch (platform) {
    case "facebook":
      return {
        accessToken: auth?.accessToken ?? meta?.pageAccessToken,
        pageId: meta?.pageId,
      };

    case "instagram":
      return {
        accessToken: auth.accessToken ?? meta?.pageAccessToken,
        pageId: meta?.pageId, // IG uses FB pageId
      };

    default:
      throw new ApiError(400, `Unsupported platform: ${platform}`);
  }
};

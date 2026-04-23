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

/**
 * Normalized input shape (what your cron/publish layer sends):
 * {
 *   type: 'image' | 'video' | 'carousel' | 'story' | 'reel',
 *   caption: string,
 *   media: [
 *     { url: string, type: 'image' | 'video' }
 *   ]
 * }
 */
export const toFacebookPayload = ({ type, caption, media }) => {
  switch (type) {
    case "image":
      return { imageUrl: media[0].url, caption };

    case "video":
      return { videoUrl: media[0].url, description: caption };

    case "story":
      return { imageUrl: media[0].url };

    case "carousel":
      return {
        // FB carousel just needs plain URL strings
        mediaUrls: media.map((m) => m.url),
        caption,
      };

    case "reel":
      // FB has no reel — fallback to video
      return { videoUrl: media[0].url, description: caption };

    default:
      throw new Error(`Unsupported Facebook post type: ${type}`);
  }
};

export const toInstagramPayload = ({ type, caption, media }) => {
  switch (type) {
    case "image":
      return { imageUrl: media[0].url, caption };

    case "video":
    case "reel":
      return { videoUrl: media[0].url, caption };

    case "story":
      return { imageUrl: media[0].url };

    case "carousel":
      return {
        // IG carousel needs {url, type} objects
        mediaUrls: media.map((m) => ({ url: m.url, type: m.type })),
        caption,
      };

    default:
      throw new Error(`Unsupported Instagram post type: ${type}`);
  }
};

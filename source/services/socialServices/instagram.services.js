// services/instagram.service.js

import axios from "axios";
import { ApiError } from "../../utilities/asyncHandler.util.js";

export const createInstagramService = ({ accessToken, pageId }) => {
  if (!accessToken) {
    throw new ApiError(400, "Instagram accessToken is required");
  }

  if (!pageId) {
    throw new ApiError(400, "Facebook pageId is required for Instagram");
  }

  const base = "https://graph.facebook.com/v18.0";

  // ----------------------------------------
  // 🔁 Common Request Wrapper
  // ----------------------------------------
  const igRequest = async ({ url, method = "GET", params = {} }) => {
    try {
      const res = await axios({
        method,
        url,
        params: {
          ...params,
          access_token: accessToken,
        },
      });

      return res.data;
    } catch (err) {
      const igError = err.response?.data?.error;

      if (igError) {
        throw new ApiError(
          err.response.status || 500,
          `Instagram Error: ${igError.message}`,
        );
      }

      throw new ApiError(500, err.message || "Instagram request failed");
    }
  };

  // ----------------------------------------
  // 📌 Get IG User ID
  // ----------------------------------------
  const getIGUserId = async () => {
    const data = await igRequest({
      url: `${base}/${pageId}`,
      params: { fields: "instagram_business_account" },
    });

    const igUserId = data.instagram_business_account?.id;

    if (!igUserId) {
      throw new ApiError(400, "Instagram account not linked to page");
    }

    return igUserId;
  };

  // ----------------------------------------
  // ⏳ Polling Helper (for video/reels/carousel)
  // ----------------------------------------
  const waitForContainer = async (containerId, retries = 40) => {
    for (let i = 0; i < retries; i++) {
      const data = await igRequest({
        url: `${base}/${containerId}`,
        params: { fields: "status_code" },
      });

      const status = data.status_code;

      if (status === "FINISHED") return true;
      if (status === "ERROR") {
        throw new ApiError(500, "Instagram media processing failed");
      }

      await new Promise((r) => setTimeout(r, 3000));
    }

    throw new ApiError(500, "Instagram processing timeout");
  };

  // ----------------------------------------
  // 🎥 REEL / VIDEO
  // ----------------------------------------
  const postReel = async ({
    videoUrl,
    caption = "",
    shareToFeed = true,
    thumbOffset,
  }) => {
    if (!videoUrl) {
      throw new ApiError(400, "videoUrl is required");
    }

    const igUserId = await getIGUserId();

    const container = await igRequest({
      url: `${base}/${igUserId}/media`,
      method: "POST",
      params: {
        media_type: "REELS",
        video_url: videoUrl,
        caption,
        share_to_feed: shareToFeed,
        ...(thumbOffset && { thumb_offset: thumbOffset }),
      },
    });

    await waitForContainer(container.id);

    const publish = await igRequest({
      url: `${base}/${igUserId}/media_publish`,
      method: "POST",
      params: {
        creation_id: container.id,
      },
    });

    return {
      platform: "instagram",
      type: "reel",
      postId: publish.id,
    };
  };

  // ----------------------------------------
  // 📖 STORY
  // ----------------------------------------
  const postStory = async ({ imageUrl }) => {
    if (!imageUrl) {
      throw new ApiError(400, "imageUrl is required");
    }

    const igUserId = await getIGUserId();

    const container = await igRequest({
      url: `${base}/${igUserId}/media`,
      method: "POST",
      params: {
        image_url: imageUrl,
        media_type: "STORIES",
      },
    });

    const publish = await igRequest({
      url: `${base}/${igUserId}/media_publish`,
      method: "POST",
      params: {
        creation_id: container.id,
      },
    });

    return {
      platform: "instagram",
      type: "story",
      postId: publish.id,
    };
  };

  const postImage = async ({ imageUrl, caption = "" }) => {
    if (!imageUrl) {
      throw new ApiError(400, "imageUrl is required");
    }

    const igUserId = await getIGUserId();

    const media = await igRequest({
      url: `${base}/${igUserId}/media`,
      method: "POST",
      params: {
        image_url: imageUrl,
        caption,
      },
    });

    const publish = await igRequest({
      url: `${base}/${igUserId}/media_publish`,
      method: "POST",
      params: {
        creation_id: media.id,
      },
    });

    return {
      platform: "instagram",
      type: "image",
      postId: publish.id,
    };
  };

  // ----------------------------------------
  // 🎞️ CAROUSEL (images + videos)
  // ----------------------------------------
  const postCarousel = async ({ mediaUrls, caption = "" }) => {
    if (!mediaUrls?.length) {
      throw new ApiError(400, "mediaUrls array is required");
    }

    if (mediaUrls.length > 10) {
      throw new ApiError(400, "Max 10 items allowed");
    }

    const igUserId = await getIGUserId();

    // Single fallback
    if (mediaUrls.length === 1) {
      const { url, type } = mediaUrls[0];

      if (type === "video") {
        return postReel({ videoUrl: url, caption });
      }

      return postImage({ imageUrl: url, caption });
    }

    // STEP 1: create child containers
    const childIds = await Promise.all(
      mediaUrls.map(async ({ url, type }) => {
        const res = await igRequest({
          url: `${base}/${igUserId}/media`,
          method: "POST",
          params: {
            ...(type === "video"
              ? { video_url: url, media_type: "VIDEO" }
              : { image_url: url }),
            is_carousel_item: true,
          },
        });

        return res.id;
      }),
    );

    // STEP 2: wait for videos
    await Promise.all(
      mediaUrls.map((m, i) =>
        m.type === "video" ? waitForContainer(childIds[i]) : Promise.resolve(),
      ),
    );

    // STEP 3: create parent
    const parent = await igRequest({
      url: `${base}/${igUserId}/media`,
      method: "POST",
      params: {
        media_type: "CAROUSEL",
        children: childIds.join(","),
        caption,
      },
    });

    await waitForContainer(parent.id);

    // STEP 4: publish
    const publish = await igRequest({
      url: `${base}/${igUserId}/media_publish`,
      method: "POST",
      params: {
        creation_id: parent.id,
      },
    });

    return {
      platform: "instagram",
      type: "carousel",
      postId: publish.id,
    };
  };

  return {
    platform: "instagram",
    postReel,
    postStory,
    postImage,
    postCarousel,
  };
};

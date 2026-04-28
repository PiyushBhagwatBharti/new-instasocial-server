// services/instagram.service.js

import axios from "axios";
import { ApiError } from "../../utilities/asyncHandler.util.js";
import { retry, sleep } from "../../utilities/retry.js";

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
      console.log(
        "[IG Full Error]",
        JSON.stringify(err.response?.data, null, 2),
      );
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
  const waitForContainer = async (containerId, retries = 80) => {
    for (let i = 0; i < retries; i++) {
      const data = await igRequest({
        url: `${base}/${containerId}`,
        params: { fields: "status_code" },
      });

      console.log(
        `[IG Container ${containerId}] (${i + 1}) status: ${data.status_code}`,
      ); // 👈 add this

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

  const postVideo = async ({
    videoUrl,
    caption = "",
    shareToFeed = true,
    thumbOffset,
  }) => {
    return await postReel({ videoUrl, caption, shareToFeed, thumbOffset });
  };

  // ----------------------------------------
  // 📖 STORY
  // ----------------------------------------
  const postStory = async ({ mediaItems }) => {
    const igUserId = await getIGUserId();

    // normalize — either single item or array
    const items = mediaItems;

    const results = [];

    for (const item of items) {
      const isVideo = item.type === "video";

      const container = await igRequest({
        url: `${base}/${igUserId}/media`,
        method: "POST",
        params: {
          media_type: "STORIES",
          ...(isVideo ? { video_url: item.url } : { image_url: item.url }),
        },
      });

      if (!container.id) {
        throw new ApiError(400, "Instagram story container creation failed");
      }

      if (isVideo) {
        await waitForContainer(container.id);
      }

      const publish = await igRequest({
        url: `${base}/${igUserId}/media_publish`,
        method: "POST",
        params: { creation_id: container.id },
      });

      results.push(publish.id);
    }

    return {
      platform: "instagram",
      type: "story",
      postId: results[0], // primary one
      allPostIds: results, // all of them
    };
  };

  const postImage = async ({ imageUrl, caption = "" }) => {
    if (!imageUrl) {
      throw new ApiError(400, "imageUrl is required");
    }

    const igUserId = await getIGUserId();
    const requestParams = {
      image_url: imageUrl,
      caption,
    };
    console.log("Inst details of post:", { imageUrl, caption, igUserId });

    // STEP 1: create container
    const media = await igRequest({
      //thrws error on this call
      url: `${base}/${igUserId}/media`,
      type: "photo",
      method: "POST",
      params: requestParams,
    });

    if (!media.id) {
      throw new ApiError(400, "Instagram media creation failed");
    }

    // 🔥 STEP 2: WAIT (THIS IS MISSING IN YOUR CODE)
    await waitForContainer(media.id);

    // OPTIONAL: small buffer (makes it even more stable)
    await sleep(1000);

    // STEP 3: publish (WITH RETRY)
    const publish = await retry(
      () =>
        igRequest({
          url: `${base}/${igUserId}/media_publish`,
          method: "POST",
          params: {
            creation_id: media.id,
          },
        }),
      {
        retries: 3,
        delay: 1200,
        shouldRetry: (err) =>
          err.message?.includes("Media ID is not available"),
      },
    );

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

    console.log("Child Containers", childIds);

    // STEP 2: wait for videos
    await Promise.all(childIds.map((id) => waitForContainer(id)));

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
    postVideo,
  };
};

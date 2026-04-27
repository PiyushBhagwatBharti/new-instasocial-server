// services/facebook.service.js
import axios from "axios";
import { ApiError } from "../../utilities/asyncHandler.util.js";

const base = "https://graph.facebook.com/v18.0";
export const createFacebookService = ({ accessToken, pageId }) => {
  if (!accessToken) {
    throw new ApiError(400, "Facebook accessToken is required");
  }

  if (!pageId) {
    throw new ApiError(400, "Facebook pageId is required");
  }

  const fbRequest = async ({ url, method = "POST", params = {} }) => {
    try {
      const response = await axios({
        method,
        url,
        params: {
          ...params,
          access_token: accessToken,
        },
      });

      return response.data;
    } catch (err) {
      const fbError = err.response?.data?.error;

      // Facebook specific error
      if (fbError) {
        throw new ApiError(
          err.response.status || 500,
          `Facebook Error: ${fbError.message}`,
        );
      }

      // Axios / Network error
      throw new ApiError(500, err.message || "Facebook request failed");
    }
  };

  // ----------------------------------------
  // 📝 Post Text
  // ----------------------------------------
  const postText = async ({ message }) => {
    if (!message) {
      throw new ApiError(400, "message is required for Facebook text post");
    }

    const data = await fbRequest({
      url: `${base}/${pageId}/feed`,
      params: {
        message,
      },
    });

    return {
      platform: "facebook",
      type: "text",
      postId: data.id,
    };
  };

  // ----------------------------------------
  // 🖼️ Post Image
  // ----------------------------------------
  const postImage = async ({ imageUrl, caption = "" }) => {
    if (!imageUrl) {
      throw new ApiError(400, "imageUrl is required for Facebook image post");
    }

    const data = await fbRequest({
      url: `${base}/${pageId}/photos`,
      params: {
        url: imageUrl,
        caption,
      },
    });

    return {
      platform: "facebook",
      type: "image",
      postId: data.id,
    };
  };

  // ----------------------------------------
  // 🎥 Post Video
  // ----------------------------------------
  const postVideo = async ({ videoUrl, description = "", title = "" }) => {
    if (!videoUrl) {
      throw new ApiError(400, "videoUrl is required for Facebook video post");
    }

    const data = await fbRequest({
      url: `${base}/${pageId}/videos`,
      params: {
        file_url: videoUrl,
        description,
        title,
      },
    });

    return {
      platform: "facebook",
      type: "video",
      postId: data.id,
    };
  };

  const postCarousel = async ({ mediaUrls, caption = "" }) => {
    if (!mediaUrls || !Array.isArray(mediaUrls) || mediaUrls.length === 0) {
      throw new ApiError(400, "mediaUrls array is required");
    }
    // single image → fallback
    if (mediaUrls.length === 1) {
      return postImage({ imageUrl: mediaUrls[0], caption });
    }

    // STEP 1: upload all as unpublished
    const photoIds = await Promise.all(
      mediaUrls.map(async (url) => {
        const res = await fbRequest({
          url: `${base}/${pageId}/photos`,
          params: {
            url,
            published: false,
          },
        });

        return res.id;
      }),
    );

    // STEP 2: attach all to feed
    const data = await fbRequest({
      url: `${base}/${pageId}/feed`,
      params: {
        message: caption,
        attached_media: JSON.stringify(
          photoIds.map((id) => ({ media_fbid: id })),
        ),
      },
    });

    return {
      platform: "facebook",
      type: "carousel",
      postId: data.id,
    };
  };

  const postStory = async ({ mediaItems }) => {
    if (!mediaItems?.length) {
      throw new ApiError(400, "mediaItems are required for story");
    }

    const results = [];

    for (const item of mediaItems) {
      const isVideo = item.type === "video";

      let postId;

      if (isVideo) {
        // ----------------------------------------
        // 🎥 Video Story
        // ----------------------------------------
        const video = await fbRequest({
          url: `${base}/${pageId}/video_stories`,
          params: {
            file_url: item.url,
            upload_phase: "finish",
          },
        });

        postId = video.post_id;
      } else {
        // ----------------------------------------
        // 🖼️ Photo Story
        // ----------------------------------------
        const photo = await fbRequest({
          url: `${base}/${pageId}/photos`,
          params: {
            url: item.url,
            published: false,
          },
        });

        const story = await fbRequest({
          url: `${base}/${pageId}/photo_stories`,
          params: {
            photo_id: photo.id,
          },
        });

        postId = story.post_id;
      }

      results.push(postId);
    }

    return {
      platform: "facebook",
      type: "story",
      postId: results[0], // primary
      allPostIds: results, // all
    };
  };

  return {
    platform: "facebook",
    postText,
    postImage,
    postVideo,
    postCarousel,
    postStory,
  };
};

export const connectFB = async (code) => {
  try {
    // 1. Get USER access token
    const tokenRes = await axios.get(`${base}/oauth/access_token`, {
      params: {
        client_id: process.env.META_CLIENT_ID,
        client_secret: process.env.META_CLIENT_SECRET,
        redirect_uri: process.env.META_REDIRECT_URI,
        code,
      },
    });

    const userAccessToken = tokenRes.data.access_token;

    // 2. Get PAGES (VERY IMPORTANT)
    const pagesRes = await axios.get(`${base}/me/accounts`, {
      params: { access_token: userAccessToken },
    });

    console.log("pagesRes", pagesRes.data);

    if (!pagesRes.data.data.length) {
      throw new Error("❌ No pages found. Make sure you are ADMIN.");
    }

    const page = pagesRes.data.data[0];
    const pageId = page.id;
    const pageAccessToken = page.access_token;

    console.log({ pageId, pageAccessToken });
    return { pageId, pageAccessToken };
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
};

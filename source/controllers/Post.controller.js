import { AUDIT_ACTIONS } from "../constants/AUDIT_MESSAGES.js";
import { PostModel } from "../models/post.model.js";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
} from "../utilities/asyncHandler.util.js";
import { createAuditLog } from "../utilities/auditLog/audit.util.js";
import { IdGenerators, sluggify } from "../utilities/idGenerators.util.js";
import { uploadImage } from "../utilities/imageUpload.js";
import QueryBuilder from "../utilities/queryBuilder.js";
import { withRetrySession } from "../utilities/session.utils.js";

export const PostController = {
  createPost: asyncHandler(async (req, res) => {
    const {
      title,
      content,
      media,
      tags = [],
      type,
      selectedPlatformName,
      scheduledFor,
      timezone = "Asia/Kolkata",
    } = req.body;

    if (!type) throw new ApiError(400, "type is required");
    if (!selectedPlatformName?.length)
      throw new ApiError(400, "platforms are required");
    if (!scheduledFor) throw new ApiError(400, "scheduledAt is required");

    // must be in the future
    if (new Date(scheduledFor) <= new Date()) {
      throw new ApiError(400, "scheduledAt must be a future date");
    }

    let resolvedMedia = [];

    if (media && media.length > 0) {
      resolvedMedia = media;
    } else if (req.files && req.files.length > 0) {
      const folder = `${req.tenant.domain}/posts`;
      resolvedMedia = await buildMediaFromFiles(req.files, folder);
    } else if (type !== "text") {
      throw new ApiError(400, `media or files are required for type: ${type}`);
    }

    const postId = IdGenerators.randomText({ len: 10, type: "alpha" });

    const { post } = await withRetrySession(async (session) => {
      const post = await PostModel.create({
        title,
        postId,
        tenantId: req.tenant._id,
        tags,
        userId: req.user._id,
        caption: content,
        media: resolvedMedia,
        type,
        platforms: selectedPlatformName,
        scheduledAt: scheduledFor,
        timezone: timezone,
        status: "pending",
      });

      return { post };
    });

    console.log({ post });

    createAuditLog({
      req,
      action: AUDIT_ACTIONS.POST_CREATE,
      entity: `Post: ${postId}`,
      entityId: post?._id,
      oldValue: null,
      newValue: post,
      description: `User "${req.user?.name}" created post ${postId}.`,
    });

    res.status(201).json(new ApiResponse(201, { post }, "Post Created"));
  }),
  // getPosts: asyncHandler(async (req, res) => {
  //   const { status, platform, from, to, page = 1, limit = 10 } = req.query;

  //   const filter = { tenantId: req.tenant._id };

  //   // filter by status
  //   if (status) {
  //     const validStatuses = [
  //       "draft",
  //       "pending",
  //       "processing",
  //       "published",
  //       "failed",
  //       "cancelled",
  //     ];
  //     if (!validStatuses.includes(status)) {
  //       throw new ApiError(400, `Invalid status: ${status}`);
  //     }
  //     filter.status = status;
  //   }

  //   // filter by platform
  //   if (platform) {
  //     const validPlatforms = ["facebook", "instagram"];
  //     if (!validPlatforms.includes(platform)) {
  //       throw new ApiError(400, `Invalid platform: ${platform}`);
  //     }
  //     filter.platforms = { $in: [platform] };
  //   }

  //   // filter by date range (scheduledAt)
  //   if (from || to) {
  //     filter.scheduledAt = {};
  //     if (from) filter.scheduledAt.$gte = new Date(from);
  //     if (to) filter.scheduledAt.$lte = new Date(to);
  //   }

  //   const pageNum = Math.max(1, parseInt(page));
  //   const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // cap at 50
  //   const skip = (pageNum - 1) * limitNum;

  //   const [posts, total] = await Promise.all([
  //     PostModel.find(filter)
  //       .sort({ scheduledAt: -1 })
  //       .skip(skip)
  //       .limit(limitNum)
  //       .lean(),
  //     PostModel.countDocuments(filter),
  //   ]);

  //   res.status(200).json(
  //     new ApiResponse(
  //       200,
  //       {
  //         posts,
  //         pagination: {
  //           total,
  //           page: pageNum,
  //           limit: limitNum,
  //           totalPages: Math.ceil(total / limitNum),
  //           hasNext: pageNum < Math.ceil(total / limitNum),
  //           hasPrev: pageNum > 1,
  //         },
  //       },
  //       "Posts fetched",
  //     ),
  //   );
  // }),

  getPosts: asyncHandler(async (req, res) => {
    const { status, platform } = req.query;
    const baseFilter = {
      tenantId: req.tenant._id,
    };

    // ── Validate status ──
    if (status) {
      const validStatuses = [
        "draft",
        "pending",
        "processing",
        "published",
        "failed",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Invalid status: ${status}`);
      }
      baseFilter.status = status;
    }

    // ── Validate platform ──
    if (platform) {
      const validPlatforms = ["facebook", "instagram"];
      if (!validPlatforms.includes(platform)) {
        throw new ApiError(400, `Invalid platform: ${platform}`);
      }
      baseFilter.platforms = { $in: [platform] };
    }

    // ── Initialize QueryBuilder ──
    const query = new QueryBuilder(
      PostModel.find(baseFilter),
      req.query,
      PostModel.schema,
    )
      .filter() // dynamic filters (scheduledAt_gte, caption_contains, etc.)
      .sort() // ?sort=scheduledAt,-createdAt
      .fields() // ?fields=caption,status
      .pagination() // ?page=1&limit=10
      .populate(); // optional

    // ── Execute queries ──
    const [posts, total] = await Promise.all([
      query.query.lean(),
      PostModel.countDocuments({
        ...baseFilter,
        ...query.query.getQuery(), // IMPORTANT: include QB filters in count
      }),
    ]);

    const pageNum = parseInt(req.query.page) || 1;
    const limitNum = parseInt(req.query.limit) || 100;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          posts,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            hasNext: pageNum < Math.ceil(total / limitNum),
            hasPrev: pageNum > 1,
          },
        },
        "Posts fetched",
      ),
    );
  }),

  getPost: asyncHandler(async (req, res) => {
    const post = await PostModel.findOne({
      postId: req.params.id,
      tenantId: req.tenant._id,
    }).lean();

    if (!post) throw new ApiError(404, "Post not found");

    res.status(200).json(new ApiResponse(200, { post }, "Post fetched"));
  }),
  updatePost: asyncHandler(async (req, res) => {
    const post = await PostModel.findOne({
      postId: req.params.id,
      tenantId: req.tenant._id,
    });

    if (!post) throw new ApiError(404, "Post not found");

    if (!["pending", "draft", "failed"].includes(post.status)) {
      throw new ApiError(400, `Cannot edit a post with status: ${post.status}`);
    }
    const mappedBody = mapUpdatePostPayload(req.body);
    const { caption, media, type, platforms, scheduledAt, timezone } =
      mappedBody;

    // if rescheduling, must be future
    if (scheduledAt && new Date(scheduledAt) <= new Date()) {
      throw new ApiError(400, "scheduledAt must be a future date");
    }

    // only allow these fields to be updated
    const allowedUpdates = {
      caption,
      media,
      type,
      platforms,
      scheduledAt,
      timezone,
    };

    // strip undefined keys so we don't overwrite with null
    Object.keys(allowedUpdates).forEach(
      (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key],
    );

    const updated = await PostModel.findByIdAndUpdate(
      req.params.id,
      { $set: allowedUpdates },
      { new: true, runValidators: true },
    ).lean();

    res
      .status(200)
      .json(new ApiResponse(200, { post: updated }, "post updated"));
  }),
  cancelPost: asyncHandler(async (req, res) => {
    const post = await PostModel.findOne({
      postId: req.params.id,
      tenantId: req.tenant._id,
    });

    if (!post) throw new ApiError(404, "Post not found");

    // can only cancel pending/draft posts
    if (!["pending", "draft"].includes(post.status)) {
      throw new ApiError(
        400,
        `Cannot cancel a post with status: ${post.status}`,
      );
    }

    post.status = "cancelled";
    await post.save();

    res.status(200).json(new ApiResponse(200, { post }, "Post canceled"));
  }),
};

const buildMediaFromFiles = async (files, folder) => {
  return Promise.all(
    files.map(async (file) => {
      const isVideo = file.mimetype.startsWith("video/");

      // use placeholder uploadVideo until you build it
      const uploadFn = isVideo ? uploadVideo : uploadImage;
      const { url, publicId } = await uploadFn(file, folder);

      return {
        url,
        key: publicId, // store for S3 deletion later
        type: isVideo ? "video" : "image",
      };
    }),
  );
};

const mapUpdatePostPayload = (body) => {
  return {
    caption: body.content,
    media: body.media,
    type: body.type,
    platforms: body.selectedPlatformName,
    scheduledAt: body.sheduledFor,
    timezone: body.timezone,
  };
};

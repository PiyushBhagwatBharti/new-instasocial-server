import { PostTagsModel } from "../models/postTags.model.js";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
} from "../utilities/asyncHandler.util.js";

export const PostTagsController = {
  create: asyncHandler(async (req, res) => {
    const { tag, color } = req.body;

    if (!tag) {
      throw new ApiError(400, "tag name is required to create a tag");
    }

    const tagDoc = PostTagsModel.create({
      tag,
      color,
      tenantId: req.tenant._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { tag: tagDoc }, "Tag created"));
  }),
  getAll: asyncHandler(async (req, res) => {
    const tags = await PostTagsModel.find({ tenantId: req.tenant._id });
    res.status(200).json(new ApiResponse(200, { tags }, "Tags fetched"));
  }),
  getById: asyncHandler(async (req, res) => {
    const id = req.query.id;

    const tag = await PostTagsModel.findOne({
      _id: id,
      tenantId: req.tenant._id,
    });
    res.status(200).json(new ApiResponse(200, { tag }, "Tag fetched"));
  }),
  update: asyncHandler(async (req, res) => {
    const id = req.query.id;
    const { tag, color } = req.body;

    const updatedTag = await PostTagsModel.findOneAndUpdate(
      {
        _id: id,
        tenantId: req.tenant._id,
      },
      { tag, color },
    );
    res
      .status(200)
      .json(new ApiResponse(200, { tag: updatedTag }, "Tag fetched"));
  }),
};

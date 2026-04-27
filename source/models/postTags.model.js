import { model, Schema } from "mongoose";
import { tenantPlugin } from "../plugins/tenant.plugin";

const postTags = new Schema(
  {
    tag: {
      type: String,
      min: 1,
      max: 15,
      trim: true,
      required: true,
    },
    color: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

postTags.plugin(tenantPlugin);
export const PostTagsModel = model("PostTags", PostTagsModel);

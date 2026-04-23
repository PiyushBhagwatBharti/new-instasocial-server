import { Router } from "express";
import { PostController } from "../controllers/Post.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/uploadFile.middleware.js";
import { jsonParser } from "../utilities/parseFromJson.js";

export const PostRouter = Router();

PostRouter.use(authMiddleware);

PostRouter.post(
  "/",
  upload.array("files", 10),
  jsonParser("platforms"),
  PostController.createPost,
);

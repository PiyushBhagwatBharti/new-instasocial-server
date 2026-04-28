import { Router } from "express";
import { PostController } from "../controllers/Post.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/uploadFile.middleware.js";
import { jsonParser } from "../utilities/parseFromJson.js";
import { authorizePermissions } from "../middleware/authorizedPermission.js";

export const PostRouter = Router();

PostRouter.use(authMiddleware);

PostRouter.post(
  "/",
  authorizePermissions("posts.create"), // or "posts.read"
  jsonParser("platforms"),
  PostController.createPost,
);

/**
 *  Get All Posts (with filters + pagination)
 */
PostRouter.get(
  "/",
  authorizePermissions("posts.read"),
  PostController.getPosts,
);

/**
 * Get Single Post
 */
PostRouter.get(
  "/:id",
  authorizePermissions("posts.read"),
  PostController.getPost,
);

/**
 *  Update Post
 */
PostRouter.patch(
  "/:id",
  authorizePermissions("posts.update"),
  PostController.updatePost,
);

PostRouter.post(
  "/:id/publish",
  authorizePermissions("posts.update"),
  PostController.publish,
);

/**
 * Cancel Post
 */
PostRouter.patch(
  "/:id/cancel",
  authorizePermissions("posts.cancel"),
  PostController.cancelPost,
);

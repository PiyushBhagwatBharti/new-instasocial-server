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
  upload.array("files", 10),
  jsonParser("platforms"),
  PostController.createPost,
);


/**
 *  Get All Posts (with filters + pagination)
 */
PostRouter.get(
  "/",
  authorizePermissions("posts.read"),
  PostController.getPosts
);

/**
 * Get Single Post
 */
PostRouter.get(
  "/:id",
  authorizePermissions("posts.read"),
  PostController.getPost
);

/**
 *  Update Post
 */
PostRouter.patch(
  "/:id",
  authMiddleware,
  authorizePermissions("posts.update"),
  // upload.array("files"),
  PostController.updatePost
);

/**
 * Cancel Post
 */
PostRouter.patch(
  "/:id/cancel",
  authorizePermissions("posts.cancel"),
  PostController.cancelPost
);

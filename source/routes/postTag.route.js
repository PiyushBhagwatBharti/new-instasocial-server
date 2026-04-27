import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { PostController } from "../controllers/Post.controller.js";

export const PostTagRouter = Router();

PostTagRouter.use(authMiddleware);
PostTagRouter.get("/", PostController.getPosts);
PostTagRouter.post("/", PostController.createPost);
PostTagRouter.patch("/", PostController.updatePost);
PostTagRouter.get("/:id", PostController.getPost);

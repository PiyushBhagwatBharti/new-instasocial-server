import { Router } from "express";
import { getPresignedUrl } from "../services/upload.service.js";
import { zod_validate } from "../middleware/validate.middleware.js";
import { getPresignedUrlSchema } from "../validations/upload.validation.js";

export const UploadRouter = Router();

UploadRouter.post(
  "/presigned-url",
  zod_validate(getPresignedUrlSchema),
  getPresignedUrl,
);

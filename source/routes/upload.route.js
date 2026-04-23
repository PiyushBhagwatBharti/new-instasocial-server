import { Router } from "express";
import { getPresignedUrl } from "../services/upload.service.js";

export const UploadRouter = Router();

UploadRouter.post("/presigned-url", getPresignedUrl);

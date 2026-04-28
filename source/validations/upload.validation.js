import { z } from "zod";

export const getPresignedUrlSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1, "fileName is required")
    .max(255, "fileName must not exceed 255 characters"),

  fileType: z
    .string()
    .trim()
    .min(1, "fileType is required")
    .max(100, "fileType must not exceed 100 characters"),

  folder: z
    .string()
    .trim()
    .min(1, "folder cannot be empty")
    .max(100, "folder must not exceed 100 characters")
    .default("uploads"),

  isPublic: z.boolean().default(true),
});

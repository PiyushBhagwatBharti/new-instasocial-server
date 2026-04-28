import {z} from "zod";

export const POST_TYPES = ["text", "image", "video", "reel", "story", "carousel"];
export const POST_PLATFORMS = ["facebook", "instagram"];
export const POST_STATUSES = [
  "draft",
  "pending",
  "processing",
  "published",
  "failed",
  "cancelled",
];


export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id format");

export const postIdSchema = z.string().trim().min(1, "Post id is required");

export const mediaItemSchema = z.object({
  url: z.string().url("Media URL must be valid"),
  type: z.enum(["image", "video"], {
    errorMap: () => ({ message: "Media type must be image or video" }),
  }),
  name: z.string().trim().optional(),
  key: z.string().trim().optional(),
});



export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password must not exceed 64 characters");

  // for porduction 
//   export const passwordSchema = z
//   .string()
//   .trim()
//   .min(8, "Password must be at least 8 characters")
//   .max(64, "Password must not exceed 64 characters")
//   .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
//   .regex(/[a-z]/, "Password must contain at least one lowercase letter")
//   .regex(/[0-9]/, "Password must contain at least one number")
//   .regex(
//     /[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?]/,
//     "Password must contain at least one special character",
//   );

export const emailSchema = z.string().trim().email("Invalid email address");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must not exceed 100 characters");

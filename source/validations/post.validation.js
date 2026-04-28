// src/validations/post.validation.js

import { z } from "zod";
import { mediaItemSchema, objectIdSchema, POST_PLATFORMS, POST_STATUSES, POST_TYPES, postIdSchema } from "../utilities/zod.utils.js";


export const createPostSchema = z
  .object({
    title: z
      .string()
      .trim()
      .max(150, "Title cannot exceed 150 characters")
      .min(2,"Must of atleast 2 characters")
      .optional(),

    content: z
      .string()
      .trim()
      .min(1, "Content is required")
      .max(2200, "Content cannot exceed 2200 characters"),

    media: z.array(mediaItemSchema).optional().default([]),

    tags: z.array(objectIdSchema).optional().default([]),

    type: z.enum(POST_TYPES, {
      errorMap: () => ({ message: "Invalid post type" }),
    }),

    selectedPlatformName: z
      .array(z.enum(POST_PLATFORMS))
      .min(1, "At least one platform is required"),

    scheduledFor: z
      .string()
      .datetime("scheduledFor must be a valid ISO datetime")
      .refine((date) => new Date(date) > new Date(), {
        message: "scheduledFor must be a future date",
      }),

    timezone: z.string().trim().default("Asia/Kolkata"),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "text" && (!data.media || data.media.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["media"],
        message: `media is required for type: ${data.type}`,
      });
    }
  });


export const getPostsSchema = z.object({
  status: z.enum(POST_STATUSES).optional(),

  platform: z.enum(POST_PLATFORMS).optional(),

  page: z.coerce.number().min(1).default(1),

  limit: z.coerce.number().min(1).max(500).default(100),

  sort: z.string().optional(),
  fields: z.string().optional(),
  populate: z.string().optional(),
});



export const getPostSchema = z.object({
  id: postIdSchema,
});


export const updatePostSchema = z
  .object({
    title: z
      .string()
      .trim()
      .max(150, "Title cannot exceed 150 characters")
      .optional(),

    content: z
      .string()
      .trim()
      .min(1, "Content cannot be empty")
      .max(2200, "Content cannot exceed 2200 characters")
      .optional(),

    media: z.array(mediaItemSchema).optional(),

    tags: z.array(objectIdSchema).optional(),

    type: z.enum(POST_TYPES).optional(),

    selectedPlatformName: z.array(z.enum(POST_PLATFORMS)).optional(),

    scheduledFor: z
      .string()
      .datetime("scheduledFor must be a valid ISO datetime")
      .optional()
      .refine((date) => !date || new Date(date) > new Date(), {
        message: "scheduledFor must be a future date",
      }),

    timezone: z.string().trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update",
  });


export const cancelPostSchema = z.object({
  id: postIdSchema,
});


export const publishPostSchema = z.object({
  id: postIdSchema,
});

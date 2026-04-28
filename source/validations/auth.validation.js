import { z } from "zod";
import { emailSchema, nameSchema, objectIdSchema, passwordSchema } from "../utilities/zod.utils.js";

export const registerCompanySchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(150, "Organization name must not exceed 150 characters"),

  name: nameSchema,

  email: emailSchema,

  password: passwordSchema,
});

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const getUserSchema = z.object({
  id: objectIdSchema.optional(),
});
import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid permission id");

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name cannot exceed 50 characters"),

  description: z
    .string()
    .trim()
    .max(255, "Description cannot exceed 255 characters")
    .optional(),

  permissionsIds: z
    .array(objectIdSchema)
    .min(1, "At least one permission is required"),

  isActive: z.boolean().optional().default(true),
});

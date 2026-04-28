import { ZodError } from "zod";
import { ApiError } from "../utilities/asyncHandler.util.js";

/* -------------------------------------------------------------------------- */
/*                               HELPERS                                      */
/* -------------------------------------------------------------------------- */

const isJsonLike = (value) =>
  (value.startsWith("{") && value.endsWith("}")) ||
  (value.startsWith("[") && value.endsWith("]"));

const coercePrimitive = (value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !Number.isNaN(Number(value))) return Number(value);
  return value;
};

const normalizeMultipartData = (payload) => {
  if (!payload || typeof payload !== "object") return payload;

  const normalized = {};

  for (const [key, rawValue] of Object.entries(payload)) {
    if (typeof rawValue !== "string") {
      normalized[key] = rawValue;
      continue;
    }

    const value = rawValue.trim();

    if (!value) {
      normalized[key] = value;
      continue;
    }

    if (isJsonLike(value)) {
      try {
        normalized[key] = JSON.parse(value);
        continue;
      } catch {
        normalized[key] = value;
        continue;
      }
    }

    normalized[key] = coercePrimitive(value);
  }

  return normalized;
};

const formatZodErrors = (error) =>
  error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

const validateSchema = async (schema, payload) => {
  try {
    return await schema.parseAsync(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(400, "Validation failed", formatZodErrors(error));
    }

    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*                               MIDDLEWARE                                   */
/* -------------------------------------------------------------------------- */

export const zod_validate = (schema, source = "body") => {
  return async (req, res, next) => {
    try {
      let payload = req[source];

      //   if (source === "body") {
      //     payload = normalizeMultipartData(payload);
      //   }

      if (source === "body" || source === "query") {
        payload = normalizeMultipartData(payload);
      }

      req[source] = await validateSchema(schema, payload);

      next();
    } catch (error) {
      next(error);
    }
  };
};

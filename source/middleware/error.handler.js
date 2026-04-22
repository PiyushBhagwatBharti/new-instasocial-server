import { ApiError } from "../utilities/asyncHandler.util.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    error = new ApiError(500, error.message || "Internal Server Error");
  }

  console.error("ERROR:", err, {
    message: error.message,
    statusCode: error.statusCode,
    stack: error.stack,
    path: req.originalUrl ?? null,
    method: req.method ?? null,
  });

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
    }),
  });
};

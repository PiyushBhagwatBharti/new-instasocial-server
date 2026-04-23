import { rateLimit } from "express-rate-limit";
import { appConfig } from "../configs/app.config.js";

export const rateLimiter = rateLimit({
  windowMs: appConfig.rateLimiter.windowMS * 60 * 1000,
  max: appConfig.rateLimiter.max_request_limit, // limit each IP to requests per window
  message: {
    status: 429,
    message: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

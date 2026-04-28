// src/config/logger.config.js
export const LOGGER_CONFIG = {
  level: process.env.LOG_LEVEL || "info",
  service: process.env.SERVICE_NAME || "instasocial-api",
  env: process.env.NODE_ENV || "development",
//   persistLevels: ["warn", "error"],
  redact: [// removing important fields
    "req.headers.authorization",
    "req.headers.cookie",
    "password",
    "token",
    "accessToken",
    "refreshToken",
    "email",
    "domain",
    "website",
    "AssignedWebhook",
    "auth.tokenExpiresAt",
    "auth.scope",
    "meta",
  ],
};

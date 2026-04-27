// src/services/log.service.js

import { logger } from "../utilities/logger/pino.logger.js";

export const LogService = {
  warn: async (payload, message) => logger.warn(payload, message),
  error: async (payload, message) => logger.error(payload, message),
};
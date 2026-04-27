// src/lib/logger/index.js
import pino from "pino";
import { LOGGER_CONFIG } from "../../configs/logger.config.js";
import { persistLogToDB } from "./db.transport.js";
import { serializeError } from "./serializers.js";

const transport =
  process.env.NODE_ENV !== "production"
    ? pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
          singleLine: false,
        },
      })
    : undefined;

const baseLogger = pino(
  {
    level: LOGGER_CONFIG.level,
    base: {
      service: LOGGER_CONFIG.service,
      env: LOGGER_CONFIG.env,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: LOGGER_CONFIG.redact,
  },
  transport
);

const buildLogger = (pinoInstance, context = {}) => {
  const write = async (level, payload = {}, message = "log") => {
    const merged = { ...context, ...payload };

    const log = {
      level,
      service: LOGGER_CONFIG.service,
      env: LOGGER_CONFIG.env,
      message,
      tenantId: merged.tenantId || null,
      userId: merged.userId || null,
      requestId: merged.requestId || null,
      module: merged.module || null,
      metadata: merged.metadata || {},
      stack: merged.stack || null,
      url: merged.url || null,
      method: merged.method || null,
      persist: merged.persist || false,
    };

    pinoInstance[level](merged, message);
    await persistLogToDB(log);
  };

  return {
    info: (payload = {}, message = "info log") => write("info", payload, message),
    warn: (payload = {}, message = "warn log") => write("warn", payload, message),

    error: async (payload = {}, message = "error log") => {
      const merged = { ...payload };

      if (merged?.error instanceof Error) {
        merged.metadata = {
          ...merged.metadata,
          error: serializeError(merged.error),
        };
        merged.stack = merged.error.stack;
      }

      await write("error", merged, message);
    },

    debug: (payload = {}, message = "debug log") => write("debug", payload, message),

    child: (childContext = {}) =>
      buildLogger(pinoInstance.child(childContext), { ...context, ...childContext }),
  };
};

export const logger = buildLogger(baseLogger);
// import { SystemLogModel } from "../../models/systemLog.model.js";
// import { sanitizeMetadata } from "./serializers.js";

// /**
//  * Persists a log entry to the database only when explicitly marked for persistence.
//  * @param {Object} log - The log object containing level, service, env, message, etc.
//  */
// export const persistLogToDB = async (log) => {
//   try {
//     // Persist only when explicitly marked
//     if (!log.persist) return;

//     await SystemLogModel.create({
//       level: log.level,
//       service: log.service,
//       env: log.env,
//       message: log.message,
//       tenantId: log.tenantId || null,
//       userId: log.userId || null,
//       requestId: log.requestId || null,
//       module: log.module || null,
//       metadata: sanitizeMetadata(log.metadata),
//       stack: log.stack || null,
//     });
//   } catch (error) {
//     console.error("Failed to persist system log:", error.message);
//   }
// };



// src/lib/logger/db.transport.js
import { SystemLogModel } from "../../models/systemLog.model.js";
import { sanitizeMetadata } from "./serializers.js";

export const persistLogToDB = async (log) => {

  console.log("DB TRANSPORT HIT", log.level, log.message);
  try {
    const isDev = process.env.NODE_ENV !== "production";

    // In production: persist only when explicitly marked
    if (!isDev && !log.persist) return;

    // In development: persist info/warn/error for easier debugging
    if (isDev && !["info", "warn", "error"].includes(log.level)) return;

    await SystemLogModel.create({
      level: log.level,
      service: log.service,
      env: log.env,
      message: log.message,
      tenantId: log.tenantId || null,
      userId: log.userId || null,
      requestId: log.requestId || null,
      module: log.module || null,
      metadata: sanitizeMetadata(log.metadata),
      url: log.url || null,
      method: log.method || null, 
      stack: log.stack || null,
    });
  } catch (error) {
    console.error("Failed to persist system log:", error.message);
  }
};
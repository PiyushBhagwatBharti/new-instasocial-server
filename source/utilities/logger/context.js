// src/lib/logger/context.js
export const createRequestLogger = (logger, context = {}) => {
  return logger.child({
    tenantId: context.tenantId || null,
    userId: context.userId || null,
    requestId: context.requestId || null,
  });
};
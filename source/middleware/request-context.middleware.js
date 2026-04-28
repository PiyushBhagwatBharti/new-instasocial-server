// src/middleware/request-context.middleware.js
import crypto from "crypto";
import { logger } from "../utilities/logger/pino.logger.js";
import { extractDomain } from "../utilities/TenantUtils/extractDomain.js";
import { TenantModel } from "../models/tenant.model.js";


export const requestContextMiddleware = async (req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  //   const tenantId = req.headers["x-tenant-id"] || null;
    // const hostUrl = req.headers["x-forwarded-host"] || null;

    const domain = extractDomain(req)
    const tenant = await TenantModel.findOne({domain});
  
  const userId = req.user?._id?.toString() || null;

  req.requestId = requestId;
  req.logger = logger.child({ requestId, tenantId: tenant?._id, userId });

  next();
};
import { redis } from "../configs/redis.config.js";
import { TenantModel } from "../models/tenant.model.js";
import { ApiError } from "../utilities/asyncHandler.util.js";
import { extractDomain } from "../utilities/TenantUtils/extractDomain.js";
import { tenantContext } from "../utilities/TenantUtils/tenantContext.js";

export const tenantResolver = async (req, res, next) => {
  try {
    const domain = extractDomain(req);

    if (!domain) {
      throw new ApiError(400, "Invalid Domain");
    }

    const cacheKey = `tenant:${process.env.NODE_ENV}:${domain}`;

    let tenant = null;

    // -------- REDIS READ (safe) --------
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        tenant = JSON.parse(cached);
      }
    } catch (err) {
      console.error("Redis GET failed:", err.message);
      // Do NOT throw — fallback to DB
    }

    // -------- DB FALLBACK --------
    if (!tenant) {
      tenant = await TenantModel.findOne({
        domain,
        isActive: true,
      })
        .select("_id isActive domain")
        .lean();

      if (!tenant) {
        throw new ApiError(404, "Tenant Not Found");
      }

      // -------- REDIS WRITE (safe) --------
      try {
        await redis.set(cacheKey, JSON.stringify(tenant), "EX", 300);
      } catch (err) {
        console.error("Redis SET failed:", err.message);
        // Ignore failure — system still works
      }
    }

    // -------- CONTEXT --------
    tenantContext.run({ tenantId: tenant._id }, () => {
      req.tenant = tenant;
      console.log({ tenant });
      next();
    });
  } catch (err) {
    next(err);
  }
};

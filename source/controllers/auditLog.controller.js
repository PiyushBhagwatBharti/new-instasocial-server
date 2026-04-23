import { AuditLog } from "../models/auditLog.model.js";
import { asyncHandler } from "../utilities/asyncHandler.util.js";

export const getAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find({ tenantId: req.tenant._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments({ tenantId: req.tenant._id }),
  ]);

  return res.json({
    page,
    limit,
    total,
    logs,
  });
});

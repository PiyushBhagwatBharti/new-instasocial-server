import { AuditLog } from "../../models/auditLog.model.js";

export const createAuditLog = async ({
  req,
  action,
  entity,
  userId,
  entityId,
  tenantId,
  description="",
  oldValue = null,
  newValue = null,
}) => {
  try {
    await AuditLog.create({
      tenantId: tenantId ?? req.tenant?._id,
      userId: userId ?? req.user?._id,
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      description,
      meta: {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};



export const getDiff = (oldObj, newObj) => {
  const diff = {};
  for (const key in newObj) {
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      diff[key] = newObj[key]
    }
  }
  return diff;
};
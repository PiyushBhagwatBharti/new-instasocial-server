import { COMMON_MESSAGES } from "../constants/API_MESSAGES.js";
import { ApiError } from "../utilities/asyncHandler.util.js";

/**
 * Middleware to authorize user based on required permissions
 * @param  {...string} requiredPermissions
 */
const authorizePermissions = function authorizePermissions(
  ...requiredPermissions
) {
  return (req, res, next) => {
    // if (!req.systemUser || !req.systemUser.roles) {
    //   return next(new ApiError(401, COMMON_MESSAGES.UNAUTHORIZED));
    // }
    const actor = req.systemUser ?? req.influencer;
    if (!actor || !actor.roles) {
      return next(new ApiError(401, COMMON_MESSAGES.UNAUTHORIZED));
    }
    // Collect permissions from all roles
    const userPermissions = new Set();

    actor.roles.forEach((role) => {
      //add from roles
      if (!role.isActive) return;
      role.permissions.forEach((p) => {
        userPermissions.add(p.key);
      });
    });

    actor.permissions?.forEach((p) => {
      //add custom permissions
      userPermissions.add(p.key);
    });

    const excludedSet = new Set(actor.excludedPermissions);

    excludedSet.forEach((permissionKey) => {
      userPermissions.delete(permissionKey?.key);
    });
    console.log(
      "requiredPermissions>>>>>>>>>>>>>>>>>>>>>",
      requiredPermissions,
    );
    console.log("userPermissions>>>>>>>>>>>>>>>>>>>>>", userPermissions);

    // Check for missing permissions
    const missing = requiredPermissions.filter(
      (perm) => !userPermissions.has(perm),
    );

    if (missing.length) {
      return next(
        new ApiError(403, `Missing permissions: ${missing.join(", ")}`),
      );
    }

    next();
  };
};

export { authorizePermissions };

import { COMMON_MESSAGES } from "../constants/API_MESSAGES.js";
import { ApiError } from "../utilities/asyncHandler.util.js";

export const authorizePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      console.log({ user });

      if (!user) {
        return next(new ApiError(401, COMMON_MESSAGES.UNAUTHORIZED));
      }

      /**
       * Expected from auth middleware:
       * user.permissions = [
       *   { key: "leads.read", isActive: true }
       * ]
       */

      const userPermissions = new Set(user.permissions.map((p) => p.key));

      console.log({ userPermissions });

      // 🔹 4. Check required permissions (AND logic)
      const missingPermissions = requiredPermissions.filter(
        (perm) => !userPermissions.has(perm),
      );

      if (missingPermissions.length > 0) {
        return next(
          new ApiError(
            403,
            `Missing permissions: ${missingPermissions.join(", ")}`,
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

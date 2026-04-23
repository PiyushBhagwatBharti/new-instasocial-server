import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model.js";
import { ApiError } from "../utilities/asyncHandler.util.js";
import { flattenUserPermissions } from "../utilities/utils.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // 🔹 1. Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Authorization token missing");
    }

    const token = authHeader.split(" ")[1];

    // 🔹 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 3. Get user from DB
    const user = await UserModel.findById(decoded._id)
      .populate([
        {
          path: "roles",
          populate: {
            path: "permissions",
            select: "key",
          },
        },
        {
          path: "extraPermissions",
          select: "key",
        },
        { path: "excludedPermissions", select: "key" },
      ])

      .lean();

    if (!user) {
      throw new ApiError(401, "Invalid token user");
    }

    // 🔹 4. Attach user
    req.user = {
      _id: user._id,
      email: user.email,
      roles: user.roles?.name,
      permissions:flattenUserPermissions({permissions: user.roles?.permissions, extraPermissions: user.extraPermissions, excludedPermissions:user.excludedPermissions }) || [],
    };

    // 🔹 5. Attach tenant (multi-tenant support)

    if (!req.tenant._id) {
      throw new ApiError(400, "Tenant ID missing");
    }

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expired"));
    }

    return next(error);
  }
};

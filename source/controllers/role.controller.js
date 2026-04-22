import { COMMON_MESSAGES, ROLE_MESSAGES } from "../constants/API_MESSAGES.js";
import { Permission } from "../models/permission.model.js";
import { Role } from "../models/role.model.js";
import { UserModel } from "../models/user.model.js";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
} from "../utilities/asyncHandler.util.js";

export const createRole = asyncHandler(async (req, res) => {
  const { name, description, permissionsIds } = req.body;
  const tenantId = req.tenant?._id;

  const existingRole = await Role.findOne({ name, tenantId });
  if (existingRole) {
    throw new ApiError(409, ROLE_MESSAGES.EXIST);
  }

  const role = await Role.create({
    name,
    description,
    permissions:permissionsIds,
    tenantId,
  });

  console.info(`role ${role.name} created`);

  return res
    .status(201)
    .json(new ApiResponse(201, role, ROLE_MESSAGES.CREATED));
});

export const getAllRoles = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id;
  let roles = await Role.find({ tenantId })
    .populate("permissions", "label isActive module")
    .lean();

  roles = await Promise.all(
    roles.map(async (r) => {
      const adminCount = await UserModel.countDocuments({ role: r._id });
      return { ...r, adminCount };
    }),
  );

  const rolesRes = roles.filter((r) => r.name !== "SuperAdmin");

  return res
    .status(200)
    .json(new ApiResponse(200, rolesRes, ROLE_MESSAGES.FETCHED));
});

export const getRoleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const role = await Role.findById(id)
    .populate("permissions", "label module")
    .lean();
  if (!role) {
    throw new ApiError(404, ROLE_MESSAGES.NOT_FOUND);
  }
  const adminCount = await Admin.countDocuments({ roles: role._id });
  return res
    .status(200)
    .json(new ApiResponse(200, { ...role, adminCount }, ROLE_MESSAGES.FETCHED));
});

export const updateRole = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, COMMON_MESSAGES.INVALID_UPDATES);
    }
    const exisitingRole = await Role.findById(id);
    if (exisitingRole.isSystem) {
      throw new ApiError(400, "System created roles cant be edited");
    }

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    );

    if (!updatedRole) {
      throw new ApiError(404, ROLE_MESSAGES.NOT_FOUND);
    }

    console.info(`role ${updatedRole.name} updated`);

    return res
      .status(200)
      .json(new ApiResponse(200, updatedRole, ROLE_MESSAGES.UPDATED));
  } catch (er) {
    if (er.code == 11000) {
      throw new ApiError(409, "Duplicate Role name not allowded");
    }

    throw er;
  }
});

export const getPermissions = asyncHandler(async (req, res) => {
  const per = await Permission.find().sort({ module: 1 });
  const toExclude = ["users", "ads"];
  const permissionRes = per.filter((per) => !toExclude.includes(per.module));
  res
    .status(200)
    .json(new ApiResponse(200, permissionRes, "Fetched Permissions"));
});

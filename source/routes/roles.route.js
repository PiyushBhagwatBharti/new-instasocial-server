import express from "express";
import { createRole, getAllRoles, getPermissions, getRoleById, updateRole } from "../controllers/role.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { authorizePermissions } from "../middleware/authorizedPermission.js";

export const RolesRouter = express.Router();
RolesRouter.use(authMiddleware);
RolesRouter.route("/").post(authorizePermissions("roles.create"), createRole).get(authorizePermissions("roles.read"),getAllRoles);

RolesRouter.get("/all-permissions",getPermissions);
RolesRouter.route("/:id").get(authorizePermissions("roles.read"),getRoleById).patch(authorizePermissions("roles.update"),updateRole);
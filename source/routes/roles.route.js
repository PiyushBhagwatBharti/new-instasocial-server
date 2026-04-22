import express from "express";
import { createRole, getAllRoles, getRoleById, updateRole } from "../controllers/role.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { authorizePermissions } from "../middleware/authorizedPermission.js";

export const RolesRouter = express.Router();
RolesRouter.use(authMiddleware);
RolesRouter.route("/").post(authorizePermissions("contacts.read"), createRole).get(getAllRoles);

RolesRouter.route("/:id").get(getRoleById).patch(updateRole);

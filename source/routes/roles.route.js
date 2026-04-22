import express from "express";
import { createRole, getAllRoles, getRoleById, updateRole } from "../controllers/role.controller.js";

export const RolesRouter = express.Router();

RolesRouter.route("/").post(createRole).get(getAllRoles);

RolesRouter.route("/:id").get(getRoleById).patch(updateRole);

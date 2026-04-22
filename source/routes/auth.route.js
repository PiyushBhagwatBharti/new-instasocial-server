import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { tenantResolver } from "../middleware/TenantResolver.js";

export const AuthRouter = Router();

AuthRouter.post("/registerCompany", UserController.registerCompany);
AuthRouter.post("/register", tenantResolver, UserController.signup);

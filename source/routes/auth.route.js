import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { tenantResolver } from "../middleware/TenantResolver.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const AuthRouter = Router();

AuthRouter.post("/registerCompany", UserController.registerCompany);
AuthRouter.post("/register", tenantResolver, UserController.signup);
AuthRouter.post("/login", UserController.login);

AuthRouter.get("/me", tenantResolver, authMiddleware, UserController.getUser);

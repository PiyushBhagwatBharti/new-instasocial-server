import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { tenantResolver } from "../middleware/TenantResolver.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { zod_validate } from "../middleware/validate.middleware.js";
import { loginSchema, registerCompanySchema, signupSchema } from "../validations/auth.validation.js";

export const AuthRouter = Router();

AuthRouter.post("/registerCompany",zod_validate(registerCompanySchema), UserController.registerCompany);
AuthRouter.post("/register",zod_validate(signupSchema), tenantResolver, UserController.signup);
AuthRouter.post("/login",zod_validate(loginSchema), UserController.login);

AuthRouter.get("/me", tenantResolver, authMiddleware, UserController.getUser);

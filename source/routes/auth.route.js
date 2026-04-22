import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";

export const AuthRouter = Router();

AuthRouter.post("/registerCompany", UserController.registerCompany);

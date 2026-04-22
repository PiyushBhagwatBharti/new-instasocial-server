import { Router } from "express";
import { AuthRouter } from "./auth.route.js";
import { tenantResolver } from "../middleware/TenantResolver.js";
import { RolesRouter } from "./roles.route.js";

const MainRouter = Router();

MainRouter.use("/auth", AuthRouter);
MainRouter.use(tenantResolver);
MainRouter.use("/roles", RolesRouter);
// MainRouter.use("/user", userRoutes);

export { MainRouter };

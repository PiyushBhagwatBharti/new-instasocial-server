import { Router } from "express";
import { AuthRouter } from "./auth.route.js";
import { tenantResolver } from "../middleware/TenantResolver.js";

const MainRouter = Router();

// MainRouter.use(tenantResolver);
MainRouter.use("/auth", AuthRouter);
// MainRouter.use("/user", userRoutes);

export { MainRouter };

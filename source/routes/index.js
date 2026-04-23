import { Router } from "express";
import { AuthRouter } from "./auth.route.js";
import { tenantResolver } from "../middleware/TenantResolver.js";
import { RolesRouter } from "./roles.route.js";
import { PlatformRouter } from "./platform.route.js";
import { CallbackRouter } from "./callbacks.route.js";

const MainRouter = Router();

MainRouter.use("/callback", CallbackRouter);

MainRouter.use("/auth", AuthRouter);
MainRouter.use(tenantResolver);
MainRouter.use("/roles", RolesRouter);
MainRouter.use("/platform", PlatformRouter);

export { MainRouter };

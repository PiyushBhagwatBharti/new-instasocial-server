import { Router } from "express";
import { AuthRouter } from "./auth.route.js";
import { tenantResolver } from "../middleware/TenantResolver.js";
import { RolesRouter } from "./roles.route.js";
import { PlatformRouter } from "./platform.route.js";
import { CallbackRouter } from "./callbacks.route.js";
import { PostRouter } from "./post.route.js";
import { JobRouter } from "./job.route.js";
import { UploadRouter } from "./upload.route.js";
import { PostTagRouter } from "./postTag.route.js";

const MainRouter = Router();

MainRouter.use((req, res, next) => {
  console.log(`[${req.method} REQUEST] for api${req.url}`);
  next();
});

MainRouter.use("/callback", CallbackRouter);
MainRouter.use("/job", JobRouter);

MainRouter.use("/auth", AuthRouter);
MainRouter.use(tenantResolver);

MainRouter.use("/roles", RolesRouter);
MainRouter.use("/platform", PlatformRouter);
MainRouter.use("/post", PostRouter);
MainRouter.use("/tag", PostTagRouter);
MainRouter.use("/upload", UploadRouter);

export { MainRouter };

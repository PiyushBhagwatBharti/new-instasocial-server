import { Router } from "express";
import { connectFB } from "../services/socialServices/facebook.service.js";
import { asyncHandler } from "../utilities/asyncHandler.util.js";
import { TenantModel } from "../models/tenant.model.js";
import { PlatformService } from "../services/Platform.service.js";
import { setTenantContext } from "../utilities/TenantUtils/tenantContext.js";

export const CallbackRouter = Router();

CallbackRouter.get(
  "/facebook",
  asyncHandler(async (req, res) => {
    const { code, state } = req.query;
    console.log({ state });

    const parsedState = JSON.parse(decodeURIComponent(state));
    const { tenantId, userId } = parsedState;
    const tenant = await TenantModel.findById({ _id: tenantId });

    console.log("This code belongs to user:", tenantId);

    const { pageId, pageAccessToken } = await connectFB(code);
    const { facebookPlatform, instaPlatform } = await setTenantContext(
      tenantId,
      async () => {
        const facebookPlatform = await PlatformService.create({
          meta: { pageId, pageAccessToken },
          auth: { accessToken: pageAccessToken },
          platform: "facebook",
          tenantId,
          connectedBy: userId,
        });
        const instaPlatform = await PlatformService.create({
          meta: { pageId, pageAccessToken },
          auth: { accessToken: pageAccessToken },
          platform: "instagram",
          tenantId,
          connectedBy: userId,
        });
        console.log("Page found");
        return { facebookPlatform, instaPlatform };
      },
    );
    res.send({ tenant, pageId, facebookPlatform, instaPlatform });
  }),
);

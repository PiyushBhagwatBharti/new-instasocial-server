import { PlatformModel } from "../models/Platform.model.js";

export const PlatformService = {
  async create({ meta, platform, connectedBy, profile, tenantId }) {
    const exisitingPlatform = await PlatformModel.findOne({
      platform,
      tenantId,
    });
    if (exisitingPlatform) {
      return exisitingPlatform;
    }

    const platform = await PlatformModel.create({
      platform,
      connectedBy,
      meta,
      profile,
      tenantId,
    });

    return platform;
  },
};

import { PlatformModel } from "../models/Platform.model.js";

export const PlatformService = {
  async create({ meta, platform, connectedBy, profile, tenantId, auth }) {
    const exisitingPlatform = await PlatformModel.findOne({
      platform,
      tenantId,
    });
    if (exisitingPlatform) {
      exisitingPlatform.meta = meta;
      exisitingPlatform.auth = auth;
      exisitingPlatform.connectedBy = connectedBy;
      await exisitingPlatform.save();
      return exisitingPlatform;
    }

    const platformDoc = await PlatformModel.create({
      platform,
      connectedBy,
      meta,
      auth,
      profile,
      tenantId,
    });

    return platformDoc;
  },

  async get(platform, tenantId) {
    const platformDoc = await PlatformModel.findOne({ platform, tenantId });
    return platformDoc;
  },
};

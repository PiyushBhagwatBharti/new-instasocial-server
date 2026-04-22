import { TenantModel } from "../models/tenant.model.js";
import { ApiError } from "../utilities/asyncHandler.util.js";
import { IdGenerators } from "../utilities/idGenerators.util.js";

export const TenantRepo = {
  create: async ({ name, ownerId, session }) => {
    if (!name) {
      throw new ApiError(400, "Name required");
    }
    let domain = IdGenerators.randomText({ len: 6, type: "text" });
    let i = 0;
    while (i < 3) {
      if (!TenantModel.exists({ domain })) break;
      domain = IdGenerators.randomText({ len: 6, type: "text" });
      i++;
    }

    const [tenant] = await TenantModel.create([{ name, domain, ownerId }], {
      session,
    });

    return tenant;
  },
};

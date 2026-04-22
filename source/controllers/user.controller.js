import { USER_CTR_MSG } from "../constants/API_MESSAGES.js";
import { OrganizationModel } from "../models/organization.model.js";
import { UserModel } from "../models/user.model.js";
import { TenantRepo } from "../reposetories/tenant.repo.js";
import { UserService } from "../services/user.service.js";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
} from "../utilities/asyncHandler.util.js";
import { withTransaction } from "../utilities/session.utils.js";
import {
  setTenantContext,
  tenantContext,
} from "../utilities/TenantUtils/tenantContext.js";

export const UserController = {
  registerCompany: asyncHandler(async (req, res) => {
    const { organizationName, name, email, password } = req.body;
    console.log("Creating super Admin", { organizationName, name, email });

    //1. create Tenant
    const { user, tenant } = await withTransaction(async (session) => {
      console.log("creting tenant");
      const tenant = await TenantRepo.create({
        name: organizationName,
        session,
      });
      console.log({ tenant });

      return await setTenantContext(tenant._id, async () => {
        const user = await UserService.create({
          name,
          email,
          skipTenantCheck: true,
          password,
          tenantId: tenant._id,
        });

        const [org] = await OrganizationModel.create(
          [
            {
              tenant: tenant._id,
              name: organizationName,
              owner: user._id,
            },
          ],
          { session },
        );

        tenant.ownerId = user._id;
        await tenant.save({ session });

        console.log({ org });

        return { user, tenant };
      });
    });

    console.log("Tenant, user, org created");

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user, domain: tenant.domain },
          "SuperAdmin created",
        ),
      );
  }),

  signup: asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      console.warn("Missing required user fields");
      throw new ApiError(400, USER_CTR_MSG.ALL_FIELDS_ARE_REQUIRED);
    }

    const newUser = await UserService.create({
      name,
      email,
      password,
      tenantId: req.tenant._id,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user: newUser },
          USER_CTR_MSG.USER_CREATED_SUCCESSFULLY,
        ),
      );
  }),
};

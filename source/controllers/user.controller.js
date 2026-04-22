import { USER_CTR_MSG } from "../constants/API_MESSAGES.js";
import { OrganizationModel } from "../models/organization.model.js";
import { UserModel } from "../models/user.model.js";
import { TenantRepo } from "../reposetories/tenant.repo.js";
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

    const existingUser = await UserModel.findOne({
      email,
      // tenantId: tenant._id,
    }).setOptions({ skipTenant: true });
    if (existingUser) {
      console.warn("Email already exists", { email });
      throw new ApiError(400, USER_CTR_MSG.EMAIL_ALREADY_EXISTS);
    }

    //1. create Tenant
    const { user, tenant } = await withTransaction(async (session) => {
      console.log("creting tenant");
      const tenant = await TenantRepo.create({
        name: organizationName,
        session,
      });
      console.log({ tenant });

      return await setTenantContext(tenant._id, async () => {
        const [user] = await UserModel.create(
          [{ name, email, password, tenantId: tenant._id }],
          {
            session,
          },
        );

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

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      console.warn("Email already exists", { email });
      throw new ApiError(400, USER_CTR_MSG.EMAIL_ALREADY_EXISTS);
    }

    const newUser = new UserModel({ name, email, password, role });
    const savedUser = await newUser.save();
    console.log("New user created", { userId: savedUser._id, email, role });

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

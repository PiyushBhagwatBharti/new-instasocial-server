import { USER_CTR_MSG } from "../constants/API_MESSAGES.js";
import { OrganizationModel } from "../models/organization.model.js";
import jwt from "jsonwebtoken";
import { TenantRepo } from "../reposetories/tenant.repo.js";
import { UserRepo } from "../reposetories/user.repo.js";
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
import { Role } from "../models/role.model.js";
import { Permission } from "../models/permission.model.js";
import { AUDIT_ACTIONS } from "../constants/AUDIT_MESSAGES.js";

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

        const permissionIds = (await Permission.find()).map(p => p._id);

        const [superadminRole] = await Role.create([{
          name: "SuperAdmin",
          isSystem: true,
          description: "The SuperAdmin role has unrestricted access to all modules, features, and permissions across the entire system. This role is system-defined and cannot be modified",
          permissions: permissionIds,
          tenantId: tenant._id

        }], {session})

        const user = await UserService.create({
          name,
          email,
          skipTenantCheck: true,
          password,
          tenantId: tenant._id,
          session,
          roles: [superadminRole._id],
          isSuperAdmin:true,
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

        createAuditLog({
          req,
          action: AUDIT_ACTIONS.ORGANIZATION_CREATE,
          entity: `Organization: ${org.name}`,
          entityId: org._id,
          oldValue: null,
          newValue: org,
          description: `Organization "${org.name}" was created with initial configuration`

        });

        return { user, tenant };
      });
    });



    console.log("Tenant, user, org created");
    
    
    

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user, tenant: { domain: tenant.domain } },
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

    createAuditLog({
          req,
          action: AUDIT_ACTIONS.USER_CREATE,
          entity: `User: ${newUser.name}`,
          entityId: newUser?._id,
          oldValue: null,
          newValue: newUser,
          description: `User "${newUser.name}" was created`

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

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await UserRepo.getUser({
      email,
      selectPassword: true,
      skipTenantCheck: true,
    });
    if (!user) {
      throw new ApiError(404, USER_CTR_MSG.USER_NOT_FOUND);
    }
    console.log({ user });
    const isMatch = await user.comparePassword(password);
    console.log({ isMatch });

    if (!isMatch) {
      throw new ApiError(404, USER_CTR_MSG.USER_NOT_FOUND);
    }

    const payload = {
      name: user.name,
      email: user.email,
      role: user.roles,
      _id: user._id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES,
    });

    const tenant = await TenantModel.findOne({ _id: user.tenantId }).select(
      "domain",
    );

    const userObj = user.toObject();
    delete userObj.password;

    createAuditLog({
          req,
          action: AUDIT_ACTIONS.USER_LOGIN,
          entity: `User: ${user.name}`,
          entityId: user?._id,
          oldValue: null,
          newValue: null,
          description: `User "${newUser.name}" login successfully.`

        });

    res.status(200).json(new ApiResponse(200, { token, user: userObj }));
  }),
};

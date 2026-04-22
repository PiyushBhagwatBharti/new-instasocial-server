import { USER_CTR_MSG } from "../constants/API_MESSAGES.js";
import { UserRepo } from "../reposetories/user.repo.js";
import { ApiError } from "../utilities/asyncHandler.util.js";

export const UserService = {
  async create({
    name,
    email,
    skipTenantCheck = false,
    password,
    role,
    tenantId,
    session,
  }) {
    const exisitingUser = await UserRepo.getUser({ email, skipTenantCheck });

    if (exisitingUser) {
      throw new ApiError(409, USER_CTR_MSG.EMAIL_ALREADY_EXISTS);
    }

    const user = await UserRepo.create({
      name,
      email,
      password,
      role,
      tenantId,
      session,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return userObj;
  },
};

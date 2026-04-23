import mongoose from "mongoose";
import { UserModel } from "../models/user.model.js";

export const UserRepo = {
  async create({
    name,
    email,
    password,
    roles = [],
    tenantId,
    session = null,
    isSuperAdmin
  }) {
    const [user] = await UserModel.create(
      [{ name, email, password, tenantId, roles, isSuperAdmin }],
      {
        session,
      },
    );

    return user;
  },

  async getUser({ email, userId, skipTenantCheck = false, selectPassword = false }) {
    let query =
      userId && mongoose.isValidObjectId(userId) ? { _id: userId } : { email };

    const existingUser = await UserModel.findOne(query).select(selectPassword ? "+password" : "").setOptions({
      skipTenant: skipTenantCheck,
    });
    return existingUser;
  },
};

import mongoose from "mongoose";
import { UserModel } from "../models/user.model.js";

export const UserRepo = {
  async create({
    name,
    email,
    password,
    role = null,
    tenantId,
    session = null,
  }) {
    const [user] = await UserModel.create(
      [{ name, email, password, tenantId, role }],
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

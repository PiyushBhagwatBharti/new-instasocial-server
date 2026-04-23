import mongoose from "mongoose";
import { tenantPlugin } from "../plugins/tenant.plugin.js";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    roles: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    extraPermissions: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "Permission",
    },
    excludedPermissions: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "Permission",
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },

    passwordChangedAt: {
      type: Date,
    },
    AssignedWebhook: {
      type: String,
    },
    isAssignedWebhook: {
      type: Boolean,
      default: false,
    },
    isSentToPabbly: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true },
);

// Pre-save hook to hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.plugin(tenantPlugin);
userSchema.index({ email: 1 }, { unique: true });
export const UserModel = mongoose.model("User", userSchema);

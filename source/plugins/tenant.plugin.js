import mongoose from "mongoose";
import { getTenantId } from "../utilities/TenantUtils/tenantContext.js";

export const tenantPlugin = (schema) => {
  schema.add({
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
  });

  const enforceTenant = function () {
    const tenantId = getTenantId();

    // Allow internal scripts to bypass
    if (this.getOptions().skipTenant) {
      return;
    }

    if (!tenantId) {
      throw new Error("Tenant context missing");
    }

    this.setQuery({
      ...this.getQuery(),
      tenantId,
    });
  };

  schema.pre(/^find/, enforceTenant);
  schema.pre(/^findOneAnd/, enforceTenant);
  schema.pre(/^update/, enforceTenant);
  schema.pre(/^delete/, enforceTenant);
  schema.pre("countDocuments", enforceTenant);
  schema.pre("distinct", enforceTenant);

  // Aggregation (handle $geoNear edge case)
  schema.pre("aggregate", function (next) {
    const tenantId = getTenantId();

    if (!tenantId) {
      return next(new Error("Tenant context missing"));
    }

    const pipeline = this.pipeline();

    if (pipeline[0]?.$geoNear) {
      pipeline.splice(1, 0, { $match: { tenantId } });
    } else {
      pipeline.unshift({ $match: { tenantId } });
    }

    next();
  });

  // Auto-assign tenantId
  schema.pre("save", function () {
    if (!this.tenantId) {
      const tenantId = getTenantId();

      if (!tenantId) {
        return next(new Error("Tenant context missing"));
      }

      this.tenantId = tenantId;
    }
  });
};

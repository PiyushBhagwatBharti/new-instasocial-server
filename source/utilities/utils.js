
export const flattenUserPermissions = ({permissions, extraPermissions, excludedPermissions}) => {
  const permissionMap = new Map(); // key -> {_id, key}

  // 🔹 1. Role permissions (only active)
  permissions?.forEach((p) => {
    if (p?.isActive !== false && p?.key) {
      permissionMap.set(p.key, {
        _id: p._id,
        key: p.key,
      });
    }
  });

  // 🔹 2. Extra/custom permissions
  extraPermissions?.forEach((p) => {
    const key = p?.key || p;
    if (!key) return;

    permissionMap.set(key, {
      _id: p?._id || null,
      key,
    });
  });

  // 🔹 3. Remove excluded permissions
  excludedPermissions?.forEach((p) => {
    const key = p?.key || p;
    if (key) {
      permissionMap.delete(key);
    }
  });

  return Array.from(permissionMap.values());
};
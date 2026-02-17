import { ApiErrors } from "../errors.js";
import logger from "../config/logger.js";

const withPermission = (permission) => {
  return (req, res, next) => {
    // Ensure permissions exists and is an array
    const permissions = Array.isArray(req?.context?.permissions)
      ? req.context.permissions
      : [];

    if (permissions.includes(permission)) {
      next();
    } else {
      logger.warn(
        {
          userId: req?.context?.user?.id,
          roleId: req?.context?.user?.roleId,
          roleName: req?.context?.user?.role?.name,
          permission,
          availablePermissions: permissions,
        },
        "Permission check failed: User does not have required permission",
      );
      throw ApiErrors.FORBIDDEN;
    }
  };
};

export default withPermission;

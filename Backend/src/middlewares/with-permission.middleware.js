import { ApiErrors } from "../errors.js";

const withPermission = (permission) => {
  return (req, res, next) => {
    if (req?.context?.permissions.includes(permission)) {
      next();
    } else {
      throw ApiErrors.FORBIDDEN;
    }
  };
};

export default withPermission;

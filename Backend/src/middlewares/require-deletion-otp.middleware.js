import otpDeletionService from "../services/otp-deletion.service.js";
import { ApiErrors } from "../errors.js";
import logger from "../config/logger.js";

/**
 * Middleware to require OTP for deletion operations
 * Only applies to Super Admin and School Admin
 */
const requireDeletionOTP = async (req, res, next) => {
  const user = req.context?.user;
  if (!user) {
    return next();
  }

  // Only apply to Super Admin and School Admin
  const adminRoles = ["SUPER_ADMIN", "SCHOOL_ADMIN"];
  if (!adminRoles.includes(user.role?.name)) {
    return next(); // Not an admin role, skip OTP requirement
  }

  // Check if OTP is provided in request
  const { otpId, otpCode } = req.body;

  if (!otpId || !otpCode) {
    // OTP not provided, return error asking for OTP
    return res.status(403).json({
      message: "Deletion requires email OTP verification",
      errorCode: "DELETION_OTP_REQUIRED",
      requiresOTP: true,
    });
  }

  // Extract entity info from route
  const routeParts = req.path.split("/").filter(Boolean);
  const entityType = routeParts[routeParts.length - 1] || routeParts[routeParts.length - 2] || "Unknown";
  const entityId = req.params.id || req.params[Object.keys(req.params)[0]] || null;

  // Get IP address
  const ipAddress =
    req.ip ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    "unknown";

  // Verify OTP
  const isValid = await otpDeletionService.verifyDeletionOTP({
    userEmail: user.email,
    otpCode,
    entityType,
    entityId,
  });

  if (!isValid) {
    logger.warn(
      { userId: user.id, entityType, entityId },
      "Deletion OTP verification failed",
    );
    throw ApiErrors.FORBIDDEN;
  }

  // OTP verified, proceed with deletion
  next();
};

export default requireDeletionOTP;


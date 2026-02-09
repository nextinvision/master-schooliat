import { Router } from "express";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission } from "../prisma/generated/index.js";
import otpDeletionService from "../services/otp-deletion.service.js";

const router = Router();

// Request deletion OTP
router.post(
  "/request",
  withPermission(Permission.REQUEST_DELETION_OTP),
  async (req, res) => {
    try {
      const { entityType, entityId } = req.body.request || {};
      const currentUser = req.context.user;

      if (!entityType || !entityId) {
        return res.status(400).json({
          message: "Entity type and ID are required",
        });
      }

      // Get IP address
      const ipAddress =
        req.ip ||
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.headers["x-real-ip"] ||
        req.connection?.remoteAddress ||
        "unknown";

      const result = await otpDeletionService.requestDeletionOTP({
        userId: currentUser.id,
        userEmail: currentUser.email,
        entityType,
        entityId,
        ipAddress,
      });

      return res.status(200).json({
        message: "Deletion OTP sent to your email",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to request deletion OTP",
      });
    }
  },
);

export default router;


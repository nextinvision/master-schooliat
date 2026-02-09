import otpService from "./otp.service.js";
import emailService from "./email.service.js";
import logger from "../config/logger.js";

/**
 * OTP service for critical deletion operations
 * Sends email OTP before allowing deletion
 */
class OTPDeletionService {
  /**
   * Request deletion OTP
   * @param {Object} data - Request data
   * @returns {Promise<Object>} - OTP request result
   */
  async requestDeletionOTP(data) {
    const { userId, userEmail, entityType, entityId, ipAddress } = data;

    // Create and send OTP using existing service
    const otpRecord = await otpService.createAndSendOTP(userEmail, "deletion", 10);

    // Send additional email with deletion context
    await emailService.sendEmail({
      to: userEmail,
      subject: "Deletion Confirmation Required",
      html: `
        <h2>Deletion Confirmation Required</h2>
        <p>You have requested to delete a ${entityType} (ID: ${entityId}).</p>
        <p>Please use the following OTP to confirm this deletion:</p>
        <h3 style="color: #dc2626; font-size: 24px; letter-spacing: 4px;">${otpRecord.otp}</h3>
        <p>This OTP will expire in 10 minutes.</p>
        <p><strong>If you did not request this deletion, please ignore this email and contact support immediately.</strong></p>
        <p>Request IP: ${ipAddress}</p>
        <p>Request Time: ${new Date().toLocaleString()}</p>
      `,
    });

    logger.info(
      { userId, entityType, entityId },
      "Deletion OTP requested and sent via email",
    );

    return {
      otpId: otpRecord.id,
      expiresAt: otpRecord.expiresAt,
      message: "OTP sent to your email address",
    };
  }

  /**
   * Verify deletion OTP
   * @param {Object} data - Verification data
   * @returns {Promise<boolean>} - True if OTP is valid
   */
  async verifyDeletionOTP(data) {
    const { userEmail, otpCode, entityType, entityId } = data;

    const result = await otpService.verifyOTP(userEmail, otpCode, "deletion");

    if (!result.valid) {
      logger.warn(
        { userEmail, entityType, entityId, error: result.error },
        "Deletion OTP verification failed",
      );
      return false;
    }

    logger.info(
      { userEmail, entityType, entityId },
      "Deletion OTP verified successfully",
    );

    return true;
  }
}

const otpDeletionService = new OTPDeletionService();

export default otpDeletionService;


import nodemailer from "nodemailer";
import config from "../config.js";
import logger from "../config/logger.js";

// Create reusable transporter
let transporter = null;

const createTransporter = () => {
  if (transporter) {
    return transporter;
  }

  // SMTP configuration from environment variables
  const smtpConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  // Only create transporter if credentials are provided
  if (smtpConfig.auth.user && smtpConfig.auth.pass) {
    transporter = nodemailer.createTransport(smtpConfig);
    logger.info("Email transporter created successfully");
  } else {
    logger.warn("SMTP credentials not configured. Email functionality will be disabled.");
  }

  return transporter;
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise<Object>} - Send result
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const emailTransporter = createTransporter();

  if (!emailTransporter) {
    logger.warn({ to, subject }, "Email not sent: SMTP not configured");
    // In development, log the email instead of failing
    if (config.ENVIRONMENT !== "production") {
      logger.info({
        to,
        subject,
        html,
        text,
      }, "Email would be sent (SMTP not configured)");
      return { success: true, messageId: "dev-mode" };
    }
    throw new Error("Email service not configured");
  }

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
    };

    const info = await emailTransporter.sendMail(mailOptions);
    logger.info({ to, subject, messageId: info.messageId }, "Email sent successfully");
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error({ error, to, subject }, "Failed to send email");
    throw error;
  }
};

/**
 * Send OTP email
 * @param {string} to - Recipient email
 * @param {string} otp - OTP code
 * @param {string} purpose - Purpose of OTP (e.g., "login", "password-reset")
 * @param {number} expiryMinutes - OTP expiry time in minutes
 * @returns {Promise<Object>} - Send result
 */
const sendOTPEmail = async (to, otp, purpose = "verification", expiryMinutes = 10) => {
  const purposeText = {
    verification: "Email Verification",
    "password-reset": "Password Reset",
    login: "Login Verification",
    deletion: "Account Deletion",
  }[purpose] || "Verification";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${purposeText} - SchooliAt</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #6f8f3e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">SchooliAt</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #6f8f3e; margin-top: 0;">${purposeText}</h2>
        <p>Hello,</p>
        <p>Your ${purposeText.toLowerCase()} code is:</p>
        <div style="background-color: #fff; border: 2px dashed #6f8f3e; padding: 20px; text-align: center; margin: 20px 0; border-radius: 4px;">
          <h1 style="color: #6f8f3e; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in <strong>${expiryMinutes} minutes</strong>.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If you didn't request this code, please ignore this email or contact support if you have concerns.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          This is an automated message from SchooliAt. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `${purposeText} Code - SchooliAt`,
    html,
  });
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {number} expiryMinutes - Token expiry time in minutes
 * @returns {Promise<Object>} - Send result
 */
const sendPasswordResetEmail = async (to, resetToken, expiryMinutes = 30) => {
  const resetUrl = `${process.env.FRONTEND_URL || process.env.API_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - SchooliAt</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #6f8f3e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">SchooliAt</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #6f8f3e; margin-top: 0;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #6f8f3e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
        <p>This link will expire in <strong>${expiryMinutes} minutes</strong>.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          This is an automated message from SchooliAt. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: "Password Reset Request - SchooliAt",
    html,
  });
};

const emailService = {
  sendEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
};

export default emailService;


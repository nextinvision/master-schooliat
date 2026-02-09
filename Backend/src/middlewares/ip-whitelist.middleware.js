import config from "../config.js";
import { ApiErrors } from "../errors.js";
import logger from "../config/logger.js";

/**
 * IP whitelist middleware for admin access
 * Only allows access from whitelisted IPs for Super Admin and School Admin
 */
const ipWhitelistMiddleware = (req, res, next) => {
  const user = req.context?.user;
  if (!user) {
    return next(); // Let authorization middleware handle this
  }

  // Only apply to Super Admin and School Admin
  const adminRoles = ["SUPER_ADMIN", "SCHOOL_ADMIN"];
  if (!adminRoles.includes(user.role?.name)) {
    return next(); // Not an admin role, skip IP check
  }

  // Get IP whitelist from config
  const allowedIPs = config.ADMIN_IP_WHITELIST || [];
  if (allowedIPs.length === 0) {
    // No whitelist configured, allow all
    return next();
  }

  // Get client IP
  const clientIP =
    req.ip ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    "unknown";

  // Check if IP is whitelisted
  const isAllowed = allowedIPs.some((allowedIP) => {
    // Support CIDR notation (e.g., "192.168.1.0/24")
    if (allowedIP.includes("/")) {
      return isIPInCIDR(clientIP, allowedIP);
    }
    // Exact match or wildcard
    if (allowedIP.includes("*")) {
      const pattern = allowedIP.replace(/\*/g, ".*");
      return new RegExp(`^${pattern}$`).test(clientIP);
    }
    return clientIP === allowedIP;
  });

  if (!isAllowed) {
    logger.warn(
      { userId: user.id, clientIP, role: user.role?.name },
      "IP whitelist check failed",
    );
    throw ApiErrors.FORBIDDEN;
  }

  next();
};

/**
 * Check if IP is in CIDR range
 * @param {string} ip - IP address
 * @param {string} cidr - CIDR notation (e.g., "192.168.1.0/24")
 * @returns {boolean}
 */
function isIPInCIDR(ip, cidr) {
  const [subnet, prefixLength] = cidr.split("/");
  const mask = ~(2 ** (32 - parseInt(prefixLength)) - 1);
  const ipNum = ipToNumber(ip);
  const subnetNum = ipToNumber(subnet);
  return (ipNum & mask) === (subnetNum & mask);
}

/**
 * Convert IP address to number
 * @param {string} ip - IP address
 * @returns {number}
 */
function ipToNumber(ip) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export default ipWhitelistMiddleware;


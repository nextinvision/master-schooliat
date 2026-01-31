import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import config from "../config.js";

/**
 * Rate limiting configuration
 * Prevents DDoS attacks and brute force attempts
 */

// Strict rate limit for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    errorCode: "RATE_LIMIT_EXCEEDED",
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests
});

// General API rate limit
export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: config.ENVIRONMENT === "production" ? 100 : 1000, // 100 req/min in prod, 1000 in dev
  message: {
    errorCode: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP address for rate limiting (with IPv6 support)
  keyGenerator: (req) => {
    // Check for forwarded IP first (from proxy/load balancer)
    const forwardedIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim();
    if (forwardedIp) {
      return forwardedIp;
    }
    const realIp = req.headers["x-real-ip"];
    if (realIp) {
      return realIp;
    }
    // Use express-rate-limit's built-in IP key generator for IPv6 support
    return ipKeyGenerator(req);
  },
});

// Strict rate limit for file uploads
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per 15 minutes
  message: {
    errorCode: "RATE_LIMIT_EXCEEDED",
    message: "Too many file uploads. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for ID card generation (resource-intensive)
export const idCardGenerationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 generations per hour
  message: {
    errorCode: "RATE_LIMIT_EXCEEDED",
    message: "Too many ID card generation requests. Please try again after 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});


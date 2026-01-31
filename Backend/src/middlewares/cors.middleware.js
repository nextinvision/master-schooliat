import cors from "cors";
import config from "../config.js";

/**
 * CORS middleware with proper origin validation
 * Supports multiple origins and proper credential handling
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Parse allowed origins from config
    const allowedOrigins =
      typeof config.ALLOWED_ORIGINS === "string"
        ? config.ALLOWED_ORIGINS === "*"
          ? "*"
          : config.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
        : config.ALLOWED_ORIGINS;

    // Allow all origins in development
    if (allowedOrigins === "*" || config.ENVIRONMENT !== "production") {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Reject origin
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true, // Allow cookies and authorization headers
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-platform",
    "x-request-id",
  ],
  exposedHeaders: ["x-request-id", "x-total-count"],
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;

// Loading environment variables (This should be at the top to load envs)
import "dotenv/config";

import express from "express";
import config from "./config.js";
import logger from "./config/logger.js";
import { addApiDocs } from "./config/docs.js";
import securityMiddleware from "./middlewares/security.middleware.js";
import compressionMiddleware from "./middlewares/compression.middleware.js";
import requestTimeoutMiddleware, {
  timeoutHandler,
} from "./middlewares/request-timeout.middleware.js";
import requestIdMiddleware from "./middlewares/request-id.middleware.js";
import corsMiddleware from "./middlewares/cors.middleware.js";
import {
  authRateLimit,
  apiRateLimit,
  uploadRateLimit,
  idCardGenerationRateLimit,
} from "./middlewares/rate-limit.middleware.js";
import authorize from "./middlewares/authorize.middleware.js";
import addReponseStatusToBody from "./middlewares/add-response-status-to-body.middleware.js";
import errorHandler from "./middlewares/error-handler.middleware.js";
import authRouter from "./routers/auth.router.js";
import userRouter from "./routers/user.router.js";
import schoolRouter from "./routers/school.router.js";
import regionRouter from "./routers/region.router.js";
import vendorRouter from "./routers/vendor.router.js";
import licenseRouter from "./routers/license.router.js";
import receiptRouter from "./routers/receipt.router.js";
import statisticsRouter from "./routers/statistics.router.js";
import locationRouter from "./routers/location.router.js";
import transportRouter from "./routers/transport.router.js";
import fileRouter from "./routers/file.router.js";
import letterheadRouter from "./routers/letterhead.router.js";
import calendarRouter from "./routers/calendar.router.js";
import examRouter from "./routers/exam.router.js";
import idCardRouter from "./routers/id-card.router.js";
import templateRouter from "./routers/template.router.js";
import settingsRouter from "./routers/settings.router.js";
import feeRouter from "./routers/fee.router.js";
import grievanceRouter from "./routers/grievance.router.js";
import salaryStructureRouter, {
  paymentRouter,
  salaryAssignmentRouter,
} from "./routers/salary.router.js";
import roleService from "./services/role.service.js";
import userService from "./services/user.service.js";
import logRequestStart from "./middlewares/log-request-start.middleware.js";
import templateLoaderService from "./services/template-loader.service.js";

async function main() {
  // App Config
  const app = express();

  // Trust proxy (required for rate limiting behind Nginx/reverse proxy)
  app.set("trust proxy", true);

  // Security middleware (must be first)
  app.use(securityMiddleware);

  // Compression middleware (before routes)
  app.use(compressionMiddleware);

  // Request timeout middleware
  app.use(requestTimeoutMiddleware);

  // Request ID tracking (for tracing and debugging)
  app.use(requestIdMiddleware);

  // Body parsing
  app.use(express.json({ limit: "10mb" })); // Add explicit body size limit
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // CORS middleware
  app.use(corsMiddleware);

  // Response status middleware
  app.use(addReponseStatusToBody);

  // Request logging (development only)
  if (config.ENVIRONMENT !== "production") {
    app.use(logRequestStart);
  }

  // API Documentation
  await addApiDocs(app);

  // Root path (for health checks and monitoring)
  app.get("/", (req, res) => {
    res.json({
      status: "healthy",
      message: "SchooliAT API is live!",
      timestamp: new Date().toISOString(),
      environment: config.ENVIRONMENT,
      version: "1.0.0",
      endpoints: {
        health: "/health",
        docs: "/docs",
        api: "/api/v1",
      },
    });
  });

  // Support HEAD requests for root (Render health checks)
  app.head("/", (req, res) => {
    res.status(200).end();
  });

  // Health check (before rate limiting)
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      message: "SchooliAT API is live!",
      timestamp: new Date().toISOString(),
      environment: config.ENVIRONMENT,
      version: "1.0.0",
    });
  });

  // Support HEAD requests for health endpoint
  app.head("/health", (req, res) => {
    res.status(200).end();
  });

  // Rate limiting for authentication endpoints
  app.use("/auth/authenticate", authRateLimit);

  // Auth router (no authorization required)
  app.use("/auth", authRouter);

  // General API rate limiting (applies to all routes below)
  app.use(apiRateLimit);

  // File upload rate limiting
  app.use("/files", uploadRateLimit);

  // Authorization middleware for all protected routes
  app.use(authorize);

  // API versioning - all routes under /api/v1
  const apiRouter = express.Router();
  
  // Health check for versioned API
  apiRouter.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      message: "SchooliAT API v1 is live!",
      timestamp: new Date().toISOString(),
      environment: config.ENVIRONMENT,
      version: "1.0.0",
    });
  });
  
  addRouters(apiRouter);
  app.use("/api/v1", apiRouter);

  // Legacy routes (without versioning) - for backward compatibility
  // TODO: Remove in future version
  addRouters(app);

  // Timeout error handler (must be before error handler)
  app.use(timeoutHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  // Starting Server
  app.listen(config.PORT, () => {
    logger.info(`Listening on port ${config.PORT}!`);
    logger.info(`Environment: ${config.ENVIRONMENT}`);
    logger.info(`Security headers: Enabled`);
    logger.info(`Rate limiting: Enabled`);
    logger.info(`Compression: Enabled`);
  });

  // Setup initial data (non-blocking)
  setupData().catch((err) => {
    logger.error({ error: err }, "Error during initial setup");
  });
}

function addRouters(app) {
  app.use("/users", userRouter);
  app.use("/schools", schoolRouter);
  app.use("/regions", regionRouter);
  app.use("/vendors", vendorRouter);
  app.use("/transports", transportRouter);
  app.use("/files", fileRouter);
  app.use("/licenses", licenseRouter);
  app.use("/receipts", receiptRouter);
  app.use("/statistics", statisticsRouter);
  app.use("/locations", locationRouter);
  app.use("/letterhead", letterheadRouter);
  app.use("/calendar", calendarRouter);
  app.use("/exams", examRouter);
  app.use("/id-cards", idCardRouter);
  app.use("/templates", templateRouter);
  app.use("/settings", settingsRouter);
  app.use("/fees", feeRouter);
  app.use("/grievances", grievanceRouter);
  app.use("/salary-structures", salaryStructureRouter);
  app.use("/salary-payments", paymentRouter);
  app.use("/salaries", salaryAssignmentRouter);
}

async function setupData() {
  try {
    await roleService.createDefaultRoles();
    await userService.createSuperAdmin();
    // Template loading is optional - server will work without it
    // Templates can be loaded later when Puppeteer is available
    await templateLoaderService.loadAllTemplates();
  } catch (error) {
    // Log error but don't crash server
    logger.error(
      { error: error.message },
      "Error during initial data setup. Server will continue running.",
    );
  }
}

main();

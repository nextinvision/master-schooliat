import logger from "../config/logger.js";

const errorHandler = (err, req, res, next) => {
  logger.error({ error: err }, err.stack, err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: statusCode,
    errorCode: err.errorCode || "SERVER_ERROR",
    message: err.message || "Internal Server Error",
  });
};

export default errorHandler;

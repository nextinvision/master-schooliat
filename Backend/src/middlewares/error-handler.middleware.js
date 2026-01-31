import logger from "../config/logger.js";

const errorHandler = (err, req, res, next) => {
  logger.error({ error: err }, err.stack, err.stack);
  res.status(err.statusCode || 500).json({
    errorCode: err.errorCode || "SERVER_ERROR",
    message: err.message || "Internal Server Error",
  });
};

export default errorHandler;

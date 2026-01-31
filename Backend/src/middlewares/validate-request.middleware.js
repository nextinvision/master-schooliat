import { ApiErrors } from "../errors.js";
import logger from "../config/logger.js";

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Combine body.request, query, and params into a single object
      const dataToValidate = {
        request: req.body?.request || {},
        query: req.query || {},
        params: req.params || {},
      };

      // Validate using safeParse
      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        // Format Zod errors into user-friendly messages
        const errors = result.error.errors.map((err) => {
          return {
            path: err?.path.join("."),
            message: err.message,
          };
        });

        return res.status(400).json({
          errorCode: "VALIDATION_ERROR",
          message: "Validation failed",
          errors: errors,
        });
      }

      // Modify req.body, req.params, and req.query directly with validated data
      // For POST/PATCH: set req.body.request to validated body
      // For GET/DELETE: ensure body is empty (validated body will be empty object)
      if (Object.keys(result.data.request).length > 0) {
        req.body.request = result.data.request;
      } else {
        // For GET/DELETE, ensure body is empty
        req.body = {};
      }

      // Update query params with validated data
      if (result.data.query) {
        Object.assign(req.query, result.data.query);
        // req["query"] = result.data.query;
      }

      // Update route params with validated data
      if (result.data.params) {
        Object.assign(req.params, result.data.params);
        // req["params"] = result.data.params;
      }

      next();
    } catch (error) {
      logger.error({ error }, `Validation middleware error`);
      return res.status(500).json({
        errorCode: "SERVER_ERROR",
        message: "Internal server error during validation",
      });
    }
  };
};

export default validateRequest;

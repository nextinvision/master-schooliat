class ApiError extends Error {
  constructor(errorCode, statusCode, message) {
    super();
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.message = message;
  }
}

const ApiErrors = {
  UNAUTHORIZED: new ApiError("SA001", 401, "Unauthorized"),
  FORBIDDEN: new ApiError("SA002", 403, "Forbidden"),
  USER_NOT_FOUND: new ApiError(
    "SA003",
    401, // Changed from 404 to 401 - authentication failures should return 401 Unauthorized
    "Invalid email or password.",
  ),
};

export { ApiError, ApiErrors };

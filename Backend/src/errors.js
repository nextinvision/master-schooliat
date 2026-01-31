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
    404,
    "User not found! Please check email and password.",
  ),
};

export { ApiError, ApiErrors };

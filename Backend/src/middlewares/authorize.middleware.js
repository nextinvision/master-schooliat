import jwt from "jsonwebtoken";
import config from "../config.js";
import { ApiErrors } from "../errors.js";
import logger from "../config/logger.js";
import prisma from "../prisma/client.js";

/**
 * Authorization middleware
 * Validates JWT token and ensures user exists and is active
 */
const authorize = async (req, res, next) => {
  const isExcluded = config.AUTH_EXCLUDED_PATHS.some((regex) =>
    regex.test(req.url),
  );
  if (isExcluded) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw ApiErrors.UNAUTHORIZED;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw ApiErrors.UNAUTHORIZED;
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: "SchooliAT",
    });

    const userId = decoded.data?.user?.id;
    if (!userId) {
      throw ApiErrors.UNAUTHORIZED;
    }

    // Validate user exists and is not deleted
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn({ userId }, "Authorization failed: User not found or deleted");
      throw ApiErrors.UNAUTHORIZED;
    }

    // Set context with fresh user data
    req.context = {
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        roleId: user.roleId,
        schoolId: user.schoolId,
        assignedRegionId: user.assignedRegionId,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      permissions: user.role.permissions,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
      logger.warn({ error: err.message }, "JWT validation failed");
      throw ApiErrors.UNAUTHORIZED;
    }
    // Re-throw ApiErrors
    if (err.errorCode) {
      throw err;
    }
    logger.error({ error: err }, "Authorization middleware error");
    throw ApiErrors.UNAUTHORIZED;
  }
};

export default authorize;

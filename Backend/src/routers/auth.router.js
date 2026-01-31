import { Router } from "express";
import prisma from "../prisma/client.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config.js";
import { ApiErrors } from "../errors.js";
import validateRequest from "../middlewares/validate-request.middleware.js";
import authenticateSchema from "../schemas/auth/authenticate.schema.js";
import { RoleName } from "../prisma/generated/index.js";
import { Platform } from "../enums/platform.js";

const router = Router();

const availablePlatformsForRoles = {
  [RoleName.SUPER_ADMIN]: [Platform.WEB],
  [RoleName.EMPLOYEE]: [Platform.ANDROID, Platform.IOS],

  [RoleName.SCHOOL_ADMIN]: [Platform.WEB],
  [RoleName.TEACHER]: [Platform.ANDROID, Platform.IOS],
  [RoleName.STUDENT]: [Platform.ANDROID, Platform.IOS],
  [RoleName.STAFF]: [Platform.ANDROID, Platform.IOS],
};

router.post(
  "/authenticate",
  validateRequest(authenticateSchema),
  async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { email: req.body.request.email },
    });

    if (user === null || user.deletedAt !== null) {
      throw ApiErrors.USER_NOT_FOUND;
    }

    const passwordMatched = await bcryptjs.compare(
      req.body.request.password,
      user.password,
    );
    if (!passwordMatched) {
      throw ApiErrors.USER_NOT_FOUND;
    }

    let role = (await prisma.role.findUnique({
      where: { id: user.roleId },
    })) || {
      name: "DEFAULT",
      permissions: [],
    };

    const platform = req.headers["x-platform"] || null;
    if (
      !platform ||
      !availablePlatformsForRoles[role.name].includes(platform)
    ) {
      throw ApiErrors.UNAUTHORIZED;
    }

    const jwtToken = jwt.sign(
      { data: { user: { ...user, role: role } } },
      config.JWT_SECRET,
      { expiresIn: `${config.JWT_EXPIRATION_TIME}h`, issuer: "SchooliAT" },
    );

    res.json({ message: "User authenticated!", token: jwtToken });
  },
);

export default router;

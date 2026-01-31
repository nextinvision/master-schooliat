import { Router } from "express";
import prisma from "../prisma/client.js";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission } from "../prisma/generated/index.js";
import validateRequest from "../middlewares/validate-request.middleware.js";
import getSettingsSchema from "../schemas/settings/get-settings.schema.js";
import updateSettingsSchema from "../schemas/settings/update-settings.schema.js";
import fileService from "../services/file.service.js";

const router = Router();

// GET settings for current school
router.get(
  "/",
  withPermission(Permission.GET_SETTINGS),
  validateRequest(getSettingsSchema),
  async (req, res) => {
    const currentUser = req.context.user;

    if (!currentUser.schoolId) {
      return res.json({
        message: "Settings - school context required",
        data: {
          note: "Settings endpoint requires school context. Use a school admin account or provide schoolId.",
        },
      });
    }

    const settings = await prisma.settings.findFirst({
      where: {
        schoolId: currentUser.schoolId,
        deletedAt: null,
      },
    });

    let logoUrl = null;
    if (settings?.logoId) {
      const logoFile = await fileService.getFileById(settings.logoId);
      if (logoFile) {
        logoUrl = fileService.attachFileURL(logoFile).url;
      }
    }

    return res.json({
      message: "Settings fetched!",
      data: settings ? { ...settings, logoUrl } : null,
    });
  },
);

// PATCH settings for current school (creates if not exists)
router.patch(
  "/",
  withPermission(Permission.EDIT_SETTINGS),
  validateRequest(updateSettingsSchema),
  async (req, res) => {
    const updateData = req.body.request || {};
    const currentUser = req.context.user;

    if (!currentUser.schoolId) {
      return res.json({
        message: "Settings - school context required",
        data: {
          note: "Settings endpoint requires school context. Use a school admin account or provide schoolId.",
        },
      });
    }

    // Check if settings exist for this school
    const existingSettings = await prisma.settings.findFirst({
      where: {
        schoolId: currentUser.schoolId,
        deletedAt: null,
      },
    });

    let resultSettings;

    if (!existingSettings) {
      // Create new settings with defaults and apply provided values
      resultSettings = await prisma.settings.create({
        data: {
          schoolId: currentUser.schoolId,
          studentFeeInstallments: updateData.studentFeeInstallments ?? 12,
          studentFeeAmount: updateData.studentFeeAmount ?? 0,
          currentInstallmentNumber: updateData.currentInstallmentNumber ?? 1,
          logoId: updateData.logoId ?? null,
          createdBy: currentUser.id,
        },
      });

      let logoUrl = null;
      if (resultSettings.logoId) {
        const logoFile = await fileService.getFileById(resultSettings.logoId);
        if (logoFile) {
          logoUrl = fileService.attachFileURL(logoFile).url;
        }
      }

      return res.status(201).json({
        message: "Settings created!",
        data: { ...resultSettings, logoUrl },
      });
    }

    // Build update data object with only provided fields
    const settingsUpdateData = {};

    if (updateData.studentFeeInstallments !== undefined) {
      settingsUpdateData.studentFeeInstallments =
        updateData.studentFeeInstallments;
    }
    if (updateData.studentFeeAmount !== undefined) {
      settingsUpdateData.studentFeeAmount = updateData.studentFeeAmount;
    }
    if (updateData.currentInstallmentNumber !== undefined) {
      settingsUpdateData.currentInstallmentNumber =
        updateData.currentInstallmentNumber;
    }
    if (updateData.logoId !== undefined) {
      settingsUpdateData.logoId = updateData.logoId;
    }

    settingsUpdateData.updatedBy = currentUser.id;

    resultSettings = await prisma.settings.update({
      where: { id: existingSettings.id },
      data: settingsUpdateData,
    });

    let logoUrl = null;
    if (resultSettings.logoId) {
      const logoFile = await fileService.getFileById(resultSettings.logoId);
      if (logoFile) {
        logoUrl = fileService.attachFileURL(logoFile).url;
      }
    }

    return res.json({
      message: "Settings updated!",
      data: { ...resultSettings, logoUrl },
    });
  },
);

export default router;

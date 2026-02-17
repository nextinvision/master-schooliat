import { Router } from "express";
import prisma from "../prisma/client.js";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission } from "../prisma/generated/index.js";
import { RoleName } from "../prisma/generated/index.js";
import validateRequest from "../middlewares/validate-request.middleware.js";
import getSettingsSchema from "../schemas/settings/get-settings.schema.js";
import updateSettingsSchema from "../schemas/settings/update-settings.schema.js";
import fileService from "../services/file.service.js";

const router = Router();

// GET settings - Platform settings for SUPER_ADMIN, School settings for SCHOOL_ADMIN
router.get(
  "/",
  withPermission(Permission.GET_SETTINGS),
  validateRequest(getSettingsSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const userRole = currentUser.role?.name;

    // Determine if this is platform settings (SUPER_ADMIN) or school settings (SCHOOL_ADMIN)
    const isPlatformSettings = userRole === RoleName.SUPER_ADMIN;
    const targetSchoolId = isPlatformSettings ? null : currentUser.schoolId;

    if (!isPlatformSettings && !currentUser.schoolId) {
      return res.json({
        message: "Settings - school context required",
        data: {
          note: "Settings endpoint requires school context. Use a school admin account or provide schoolId.",
        },
      });
    }

    const settings = await prisma.settings.findFirst({
      where: {
        schoolId: targetSchoolId,
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

    // Handle platformConfig field safely (may not exist if migration not applied)
    let settingsData = settings;
    if (settings) {
      settingsData = { ...settings };
      // Only include platformConfig if it exists (migration applied)
      if (settings.platformConfig === undefined) {
        // Field doesn't exist yet, don't include it
        delete settingsData.platformConfig;
      }
    }

    return res.json({
      message: "Settings fetched!",
      data: settingsData ? { ...settingsData, logoUrl } : null,
    });
  },
);

// PATCH settings - Platform settings for SUPER_ADMIN, School settings for SCHOOL_ADMIN
router.patch(
  "/",
  withPermission(Permission.EDIT_SETTINGS),
  validateRequest(updateSettingsSchema),
  async (req, res) => {
    const updateData = req.body.request || {};
    const currentUser = req.context.user;
    const userRole = currentUser.role?.name;

    // Determine if this is platform settings (SUPER_ADMIN) or school settings (SCHOOL_ADMIN)
    const isPlatformSettings = userRole === RoleName.SUPER_ADMIN;
    const targetSchoolId = isPlatformSettings ? null : currentUser.schoolId;

    if (!isPlatformSettings && !currentUser.schoolId) {
      return res.json({
        message: "Settings - school context required",
        data: {
          note: "Settings endpoint requires school context. Use a school admin account or provide schoolId.",
        },
      });
    }

    // Check if settings exist
    const existingSettings = await prisma.settings.findFirst({
      where: {
        schoolId: targetSchoolId,
        deletedAt: null,
      },
    });

    let resultSettings;

    if (!existingSettings) {
      // Create new settings with defaults and apply provided values
      const createData = {
        schoolId: targetSchoolId,
        studentFeeInstallments: updateData.studentFeeInstallments ?? 12,
        studentFeeAmount: updateData.studentFeeAmount ?? 0,
        currentInstallmentNumber: updateData.currentInstallmentNumber ?? 1,
        logoId: updateData.logoId ?? null,
        createdBy: currentUser.id,
      };
      
      // Only include platformConfig if provided (migration may not be applied yet)
      if (updateData.platformConfig !== undefined) {
        createData.platformConfig = updateData.platformConfig;
      }
      
      resultSettings = await prisma.settings.create({
        data: createData,
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
    if (updateData.platformConfig !== undefined) {
      // Merge with existing platform config if it exists
      // Handle case where platformConfig field might not exist yet (migration not applied)
      let existingConfig = {};
      if (existingSettings.platformConfig !== undefined && existingSettings.platformConfig !== null) {
        existingConfig = existingSettings.platformConfig;
      }
      settingsUpdateData.platformConfig = {
        ...existingConfig,
        ...updateData.platformConfig,
      };
    }

    settingsUpdateData.updatedBy = currentUser.id;

    try {
      resultSettings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: settingsUpdateData,
      });
    } catch (error) {
      // If error is due to platformConfig field not existing (migration not applied),
      // retry without platformConfig
      if (error.message && error.message.includes('platform_config')) {
        delete settingsUpdateData.platformConfig;
        resultSettings = await prisma.settings.update({
          where: { id: existingSettings.id },
          data: settingsUpdateData,
        });
      } else {
        throw error;
      }
    }

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

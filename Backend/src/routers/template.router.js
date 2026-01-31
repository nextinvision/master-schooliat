import { Router } from "express";
import validateRequest from "../middlewares/validate-request.middleware.js";
import fileService from "../services/file.service.js";
import templateService from "../services/template.service.js";
import getTemplatesSchema from "../schemas/template/get-templates.schema.js";

const router = Router();

router.get("/", validateRequest(getTemplatesSchema), async (req, res) => {
  const { type } = req.query;

  const templates = await templateService.getTemplates(type);

  // Attach file URLs for image and sample
  const templatesWithUrls = templates.map((template) => ({
    ...template,
    imageUrl: template.imageId
      ? fileService.attachFileURL({ id: template.imageId, extension: "png" })
          .url
      : null,
    sampleUrl: template.sampleId
      ? fileService.attachFileURL({ id: template.sampleId, extension: "pdf" })
          .url
      : null,
  }));

  return res.json({
    message: "Templates fetched successfully",
    data: templatesWithUrls,
  });
});

router.get("/:templateId/default", async (req, res) => {
  const { templateId } = req.params;

  try {
    const defaults = await templateService.getTemplateDefaults(templateId);

    return res.json({
      message: "Template defaults fetched successfully",
      data: defaults,
    });
  } catch (error) {
    if (
      error.message === "Template not found" ||
      error.message.includes("Schema file not found")
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }
    return res.status(500).json({
      message: "Failed to fetch template defaults",
      error: error.message,
    });
  }
});

export default router;

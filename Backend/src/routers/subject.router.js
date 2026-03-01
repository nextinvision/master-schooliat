import { Router } from "express";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission } from "../prisma/generated/index.js";
import validateRequest from "../middlewares/validate-request.middleware.js";
import getSubjectsSchema from "../schemas/subject/get-subjects.schema.js";
import subjectService from "../services/subject.service.js";
import logger from "../config/logger.js";

const router = Router();

router.get(
    "/",
    withPermission([Permission.GET_CLASSES, Permission.GET_HOMEWORK]),
    validateRequest(getSubjectsSchema),
    async (req, res) => {
        const currentUser = req.context.user;
        const { classId, page, limit } = req.query;

        try {
            const result = await subjectService.getSubjects(currentUser.schoolId, {
                classId,
                page,
                limit,
            });

            return res.json({
                message: "Subjects fetched successfully",
                data: result.subjects,
                pagination: {
                    total: result.total,
                    totalPages: result.totalPages,
                    page: page,
                    limit: limit,
                },
            });
        } catch (error) {
            logger.error({ error, query: req.query }, "Failed to fetch subjects");
            return res.status(500).json({
                errorCode: "SUBJECTS_FETCH_FAILED",
                message: "Failed to fetch subjects",
            });
        }
    },
);

export default router;

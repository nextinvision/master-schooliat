import { Router } from "express";
import prisma from "../prisma/client.js";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission } from "../prisma/generated/index.js";
import validateRequest from "../middlewares/validate-request.middleware.js";
import enterMarksSchema from "../schemas/marks/enter-marks.schema.js";
import enterBulkMarksSchema from "../schemas/marks/enter-bulk-marks.schema.js";
import calculateResultSchema from "../schemas/marks/calculate-result.schema.js";
import publishResultsSchema from "../schemas/marks/publish-results.schema.js";
import marksService from "../services/marks.service.js";
import logger from "../config/logger.js";

const router = Router();

// Enter marks
router.post(
  "/",
  withPermission([Permission.ENTER_MARKS]),
  validateRequest(enterMarksSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const { examId, studentId, subjectId, classId, marksObtained, maxMarks } = req.body.request;

    // Verify exam exists and belongs to school
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam || exam.schoolId !== currentUser.schoolId) {
      return res.status(404).json({
        errorCode: "EXAM_NOT_FOUND",
        message: "Exam not found",
      });
    }

    // Verify student belongs to class and school
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: {
          select: {
            classId: true,
          },
        },
      },
    });

    if (!student || !student.studentProfile || student.studentProfile.classId !== classId) {
      return res.status(400).json({
        errorCode: "INVALID_STUDENT",
        message: "Student does not belong to the specified class",
      });
    }

    try {
      const marks = await marksService.enterMarks({
        examId,
        studentId,
        subjectId,
        classId,
        marksObtained,
        maxMarks,
        schoolId: currentUser.schoolId,
        createdBy: currentUser.id,
      });

      res.json({
        message: "Marks entered successfully",
        data: marks,
      });
    } catch (error) {
      logger.error({ error, body: req.body }, "Failed to enter marks");
      res.status(400).json({
        errorCode: "MARKS_ENTRY_FAILED",
        message: error.message || "Failed to enter marks",
      });
    }
  },
);

// Enter bulk marks
router.post(
  "/bulk",
  withPermission([Permission.ENTER_MARKS]),
  validateRequest(enterBulkMarksSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const { marks: marksData } = req.body.request;

    // Add schoolId to each marks record
    const marksWithSchool = marksData.map((m) => ({
      ...m,
      schoolId: currentUser.schoolId,
    }));

    try {
      const result = await marksService.enterBulkMarks(marksWithSchool, currentUser.id);

      res.json({
        message: "Bulk marks entered successfully",
        data: {
          created: result.created,
          updated: result.updated,
          errors: result.errors,
        },
      });
    } catch (error) {
      logger.error({ error }, "Failed to enter bulk marks");
      res.status(400).json({
        errorCode: "BULK_MARKS_ENTRY_FAILED",
        message: error.message || "Failed to enter bulk marks",
      });
    }
  },
);

// Calculate result
router.post(
  "/calculate-result",
  withPermission([Permission.ENTER_MARKS]),
  validateRequest(calculateResultSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const { examId, studentId, classId, gradeConfig } = req.body.request;

    try {
      const result = await marksService.calculateResult(
        examId,
        studentId,
        classId,
        gradeConfig || {},
        currentUser.id,
      );

      res.json({
        message: "Result calculated successfully",
        data: result,
      });
    } catch (error) {
      logger.error({ error, body: req.body }, "Failed to calculate result");
      res.status(400).json({
        errorCode: "RESULT_CALCULATION_FAILED",
        message: error.message || "Failed to calculate result",
      });
    }
  },
);

// Publish results
router.post(
  "/publish",
  withPermission([Permission.PUBLISH_RESULTS]),
  validateRequest(publishResultsSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const { examId, classId } = req.body.request;

    // Verify exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam || exam.schoolId !== currentUser.schoolId) {
      return res.status(404).json({
        errorCode: "EXAM_NOT_FOUND",
        message: "Exam not found",
      });
    }

    try {
      const result = await marksService.publishResults(
        examId,
        classId || null,
        currentUser.id,
      );

      res.json({
        message: "Results published successfully",
        data: {
          published: result.published,
          studentsNotified: result.results.length,
        },
      });
    } catch (error) {
      logger.error({ error, examId, classId }, "Failed to publish results");
      res.status(400).json({
        errorCode: "PUBLISH_RESULTS_FAILED",
        message: error.message || "Failed to publish results",
      });
    }
  },
);

// Get marks
router.get(
  "/",
  withPermission([Permission.GET_MARKS]),
  async (req, res) => {
    const currentUser = req.context.user;
    const { examId, studentId, classId } = req.query;

    try {
      // Role-based access
      if (currentUser.role.name === "STUDENT") {
        // Students can only see their own marks
        const marks = await marksService.getStudentMarks(
          currentUser.id,
          examId || null,
        );

        return res.json({
          message: "Marks retrieved successfully",
          data: marks,
        });
      }

      if (currentUser.role.name === "PARENT") {
        // Parents can see their children's marks
        if (!studentId) {
          return res.status(400).json({
            errorCode: "STUDENT_ID_REQUIRED",
            message: "Please specify studentId to view marks",
          });
        }

        // Verify parent-child relationship
        const link = await prisma.parentChildLink.findFirst({
          where: {
            parentId: currentUser.id,
            childId: studentId,
            deletedAt: null,
          },
        });

        if (!link) {
          return res.status(403).json({
            errorCode: "FORBIDDEN",
            message: "You can only view your children's marks",
          });
        }

        const marks = await marksService.getStudentMarks(studentId, examId || null);

        return res.json({
          message: "Marks retrieved successfully",
          data: marks,
        });
      }

      // Teachers and admins
      if (examId && classId) {
        const marks = await marksService.getExamMarks(examId, classId);

        return res.json({
          message: "Exam marks retrieved successfully",
          data: marks,
        });
      }

      if (studentId) {
        const marks = await marksService.getStudentMarks(studentId, examId || null);

        return res.json({
          message: "Student marks retrieved successfully",
          data: marks,
        });
      }

      res.status(400).json({
        errorCode: "INVALID_QUERY",
        message: "Please specify examId with classId, or studentId",
      });
    } catch (error) {
      logger.error({ error, query: req.query }, "Failed to get marks");
      res.status(500).json({
        errorCode: "MARKS_FETCH_FAILED",
        message: "Failed to retrieve marks",
      });
    }
  },
);

// Get results
router.get(
  "/results",
  withPermission([Permission.GET_RESULTS]),
  async (req, res) => {
    const currentUser = req.context.user;
    const { examId, studentId } = req.query;

    try {
      // Role-based access
      if (currentUser.role.name === "STUDENT") {
        const results = await marksService.getStudentResults(
          currentUser.id,
          examId || null,
        );

        return res.json({
          message: "Results retrieved successfully",
          data: results,
        });
      }

      if (currentUser.role.name === "PARENT") {
        if (!studentId) {
          return res.status(400).json({
            errorCode: "STUDENT_ID_REQUIRED",
            message: "Please specify studentId to view results",
          });
        }

        // Verify parent-child relationship
        const link = await prisma.parentChildLink.findFirst({
          where: {
            parentId: currentUser.id,
            childId: studentId,
            deletedAt: null,
          },
        });

        if (!link) {
          return res.status(403).json({
            errorCode: "FORBIDDEN",
            message: "You can only view your children's results",
          });
        }

        const results = await marksService.getStudentResults(studentId, examId || null);

        return res.json({
          message: "Results retrieved successfully",
          data: results,
        });
      }

      // Teachers and admins
      if (studentId) {
        const results = await marksService.getStudentResults(studentId, examId || null);

        return res.json({
          message: "Student results retrieved successfully",
          data: results,
        });
      }

      res.status(400).json({
        errorCode: "INVALID_QUERY",
        message: "Please specify studentId",
      });
    } catch (error) {
      logger.error({ error, query: req.query }, "Failed to get results");
      res.status(500).json({
        errorCode: "RESULTS_FETCH_FAILED",
        message: "Failed to retrieve results",
      });
    }
  },
);

export default router;


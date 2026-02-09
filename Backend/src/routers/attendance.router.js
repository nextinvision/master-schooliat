import { Router } from "express";
import prisma from "../prisma/client.js";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission } from "../prisma/generated/index.js";
import validateRequest from "../middlewares/validate-request.middleware.js";
import markAttendanceSchema from "../schemas/attendance/mark-attendance.schema.js";
import markBulkAttendanceSchema from "../schemas/attendance/mark-bulk-attendance.schema.js";
import getAttendanceSchema from "../schemas/attendance/get-attendance.schema.js";
import getAttendanceReportSchema from "../schemas/attendance/get-attendance-report.schema.js";
import { createAttendancePeriodSchema, getAttendancePeriodsSchema } from "../schemas/attendance/attendance-period.schema.js";
import attendanceService from "../services/attendance.service.js";
import logger from "../config/logger.js";

const router = Router();

// Mark daily attendance
router.post(
  "/mark",
  withPermission([Permission.MARK_ATTENDANCE]),
  validateRequest(markAttendanceSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const { studentId, classId, date, status, periodId, lateArrivalTime, absenceReason } = req.body.request;

    // Verify user has access to this class (for teachers)
    if (currentUser.role.name === "TEACHER") {
      // TODO: Add class-teacher relationship check
      // For now, allow if user is teacher
    }

    const attendance = await attendanceService.markAttendance({
      studentId,
      classId,
      date: new Date(date),
      status,
      periodId: periodId || null,
      lateArrivalTime: lateArrivalTime ? new Date(lateArrivalTime) : null,
      absenceReason: absenceReason || null,
      markedBy: currentUser.id,
      schoolId: currentUser.schoolId,
    });

    res.json({
      message: "Attendance marked successfully",
      data: attendance,
    });
  },
);

// Mark bulk attendance
router.post(
  "/mark-bulk",
  withPermission([Permission.MARK_ATTENDANCE]),
  validateRequest(markBulkAttendanceSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const { attendances } = req.body.request;

    // Add schoolId and markedBy to each attendance record
    const attendanceData = attendances.map((att) => ({
      ...att,
      date: new Date(att.date),
      lateArrivalTime: att.lateArrivalTime ? new Date(att.lateArrivalTime) : null,
      schoolId: currentUser.schoolId,
      markedBy: currentUser.id,
    }));

    const result = await attendanceService.markBulkAttendance(attendanceData, currentUser.id);

    res.json({
      message: "Bulk attendance marked successfully",
      data: {
        created: result.created,
        updated: result.updated,
        errors: result.errors,
      },
    });
  },
);

// Get attendance
router.get(
  "/",
  withPermission([Permission.GET_ATTENDANCE]),
  validateRequest(getAttendanceSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const { studentId, classId, startDate, endDate, date, page, limit } = req.query;

    // Role-based access control
    if (currentUser.role.name === "STUDENT") {
      // Students can only see their own attendance
      const attendance = await attendanceService.getStudentAttendance(
        currentUser.id,
        startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1)),
        endDate ? new Date(endDate) : new Date(),
      );

      return res.json({
        message: "Attendance retrieved successfully",
        data: attendance,
      });
    }

    if (currentUser.role.name === "PARENT") {
      // Parents can see their children's attendance
      // Get linked children
      const parentLinks = await prisma.parentChildLink.findMany({
        where: {
          parentId: currentUser.id,
          deletedAt: null,
        },
        select: {
          childId: true,
        },
      });

      const childIds = parentLinks.map((link) => link.childId);
      if (childIds.length === 0) {
        return res.json({
          message: "No children linked to this account",
          data: [],
        });
      }

      const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const end = endDate ? new Date(endDate) : new Date();

      const allAttendance = await Promise.all(
        childIds.map((childId) =>
          attendanceService.getStudentAttendance(childId, start, end),
        ),
      );

      return res.json({
        message: "Attendance retrieved successfully",
        data: allAttendance.flat(),
      });
    }

    // For teachers and admins
    if (date && classId) {
      // Get class attendance for specific date
      const attendance = await attendanceService.getClassAttendance(
        classId,
        new Date(date),
      );

      return res.json({
        message: "Class attendance retrieved successfully",
        data: attendance,
      });
    }

    if (studentId) {
      // Get student attendance
      const attendance = await attendanceService.getStudentAttendance(
        studentId,
        startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1)),
        endDate ? new Date(endDate) : new Date(),
      );

      return res.json({
        message: "Student attendance retrieved successfully",
        data: attendance,
      });
    }

    // Default: return empty if no specific query
    res.json({
      message: "Please specify studentId, classId with date, or use report endpoint",
      data: [],
    });
  },
);

// Get attendance statistics
router.get(
  "/statistics",
  withPermission([Permission.GET_ATTENDANCE]),
  validateRequest(getAttendanceSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const { studentId, classId, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    // Role-based access
    let finalStudentId = studentId;
    let finalClassId = classId;
    let finalSchoolId = currentUser.schoolId;

    if (currentUser.role.name === "STUDENT") {
      finalStudentId = currentUser.id;
    } else if (currentUser.role.name === "PARENT") {
      // Get first child for parent (or allow parent to specify)
      if (!finalStudentId) {
        const parentLink = await prisma.parentChildLink.findFirst({
          where: {
            parentId: currentUser.id,
            deletedAt: null,
          },
        });
        if (parentLink) {
          finalStudentId = parentLink.childId;
        }
      }
    }

    const statistics = await attendanceService.getAttendanceStatistics(
      finalStudentId,
      finalClassId,
      finalSchoolId,
      start,
      end,
    );

    res.json({
      message: "Attendance statistics retrieved successfully",
      data: statistics,
    });
  },
);

// Get attendance report
router.get(
  "/report",
  withPermission([Permission.EXPORT_ATTENDANCE]),
  validateRequest(getAttendanceReportSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const { studentId, classId, schoolId, startDate, endDate, status, format } = req.query;

    const filters = {
      studentId: studentId || (currentUser.role.name === "STUDENT" ? currentUser.id : null),
      classId,
      schoolId: schoolId || currentUser.schoolId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
    };

    const reportData = await attendanceService.getAttendanceReport(filters);

    if (format === "json") {
      return res.json({
        message: "Attendance report retrieved successfully",
        data: reportData,
      });
    }

    // TODO: Implement PDF and Excel export
    // For now, return JSON
    res.json({
      message: "Attendance report retrieved successfully",
      data: reportData,
      note: "PDF and Excel export coming soon",
    });
  },
);

// Create attendance period
router.post(
  "/periods",
  withPermission([Permission.MARK_ATTENDANCE]),
  validateRequest(createAttendancePeriodSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const { name, startTime, endTime } = req.body.request;

    // Validate time range
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      return res.status(400).json({
        errorCode: "INVALID_TIME_RANGE",
        message: "End time must be after start time",
      });
    }

    const period = await prisma.attendancePeriod.create({
      data: {
        name,
        startTime,
        endTime,
        schoolId: currentUser.schoolId,
        createdBy: currentUser.id,
      },
    });

    res.json({
      message: "Attendance period created successfully",
      data: period,
    });
  },
);

// Get attendance periods
router.get(
  "/periods",
  withPermission([Permission.GET_ATTENDANCE]),
  validateRequest(getAttendancePeriodsSchema),
  async (req, res) => {
    const currentUser = req.context.user;

    const periods = await prisma.attendancePeriod.findMany({
      where: {
        schoolId: currentUser.schoolId,
        deletedAt: null,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    res.json({
      message: "Attendance periods retrieved successfully",
      data: periods,
    });
  },
);

export default router;


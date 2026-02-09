import { Router } from "express";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission } from "../prisma/generated/index.js";
import tcService from "../services/tc.service.js";
import validateRequest from "../middlewares/validate-request.middleware.js";
import { z } from "zod";

const router = Router();

// Create TC schema
const createTCSchema = z.object({
  body: z.object({
    request: z.object({
      studentId: z.string().uuid(),
      reason: z.string().min(1),
      transferDate: z.string().datetime(),
      destinationSchool: z.string().optional(),
      remarks: z.string().optional(),
    }),
  }),
});

// Get TCs schema
const getTCsSchema = z.object({
  query: z.object({
    studentId: z.string().uuid().optional(),
    status: z.enum(["ISSUED", "COLLECTED", "CANCELLED"]).optional(),
    tcNumber: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

// Update TC status schema
const updateTCStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    request: z.object({
      status: z.enum(["ISSUED", "COLLECTED", "CANCELLED"]),
    }),
  }),
});

// Create TC
router.post(
  "/",
  withPermission(Permission.CREATE_STUDENT), // Using existing permission, can add specific TC permission later
  validateRequest(createTCSchema),
  async (req, res) => {
    try {
      const { studentId, reason, transferDate, destinationSchool, remarks } = req.body.request;
      const currentUser = req.context.user;

      const tc = await tcService.createTC({
        studentId,
        schoolId: currentUser.schoolId,
        reason,
        transferDate,
        destinationSchool,
        remarks,
        createdBy: currentUser.id,
      });

      return res.status(201).json({
        message: "Transfer Certificate created successfully",
        data: tc,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to create Transfer Certificate",
      });
    }
  },
);

// Get TCs
router.get(
  "/",
  withPermission(Permission.GET_STUDENTS),
  validateRequest(getTCsSchema),
  async (req, res) => {
    try {
      const currentUser = req.context.user;
      const { studentId, status, tcNumber, page, limit } = req.query;

      const result = await tcService.getTCs(
        {
          schoolId: currentUser.schoolId,
          studentId,
          status,
          tcNumber,
        },
        {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 50,
        },
      );

      return res.status(200).json({
        message: "Transfer Certificates fetched successfully",
        data: result.tcs,
        pagination: result.pagination,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to fetch Transfer Certificates",
      });
    }
  },
);

// Get TC by ID
router.get(
  "/:id",
  withPermission(Permission.GET_STUDENTS),
  async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.context.user;

      const tc = await tcService.getTCById(id, currentUser.schoolId);

      if (!tc) {
        return res.status(404).json({
          message: "Transfer Certificate not found",
        });
      }

      return res.status(200).json({
        message: "Transfer Certificate fetched successfully",
        data: tc,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to fetch Transfer Certificate",
      });
    }
  },
);

// Update TC status
router.patch(
  "/:id/status",
  withPermission(Permission.EDIT_STUDENT),
  validateRequest(updateTCStatusSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body.request;
      const currentUser = req.context.user;

      const tc = await tcService.updateTCStatus(id, status, currentUser.id);

      return res.status(200).json({
        message: "Transfer Certificate status updated successfully",
        data: tc,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to update Transfer Certificate status",
      });
    }
  },
);

// Delete TC
router.delete(
  "/:id",
  withPermission(Permission.DELETE_STUDENT),
  async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.context.user;

      await tcService.deleteTC(id, currentUser.id);

      return res.status(200).json({
        message: "Transfer Certificate deleted successfully",
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to delete Transfer Certificate",
      });
    }
  },
);

export default router;


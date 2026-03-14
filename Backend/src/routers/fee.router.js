import { Router } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import prisma from "../prisma/client.js";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission, FeePaymentStatus } from "../prisma/generated/index.js";
import validateRequest from "../middlewares/validate-request.middleware.js";
import getInstallmentsSchema from "../schemas/fee/get-installments.schema.js";
import getStudentInstallmentsSchema from "../schemas/fee/get-student-installments.schema.js";
import recordPaymentSchema from "../schemas/fee/record-payment.schema.js";
import fileService from "../services/file.service.js";
import { uploadFile } from "../config/storage/index.js";
import logger from "../config/logger.js";
import feeService from "../services/fee.service.js";
import otpService from "../services/otp.service.js";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load fee receipt template
const getFeeReceiptTemplate = () => {
  const templatePath = join(
    __dirname,
    "../templates/receipts/fee/1/template.html",
  );
  const stylePath = join(__dirname, "../templates/receipts/fee/1/styles.css");

  const template = readFileSync(templatePath, "utf-8");
  const styles = readFileSync(stylePath, "utf-8");

  // Inject styles inline
  return template.replace(
    '<link rel="stylesheet" href="styles.css">',
    `<style>${styles}</style>`,
  );
};

// Convert number to words (Indian format)
const numberToWords = (num) => {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (num === 0) return "Zero Rupees Only";

  const convertLessThanThousand = (n) => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100)
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
      );
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
    );
  };

  const intPart = Math.floor(num);
  let words = "";
  let remaining = intPart;

  if (remaining >= 10000000) {
    words +=
      convertLessThanThousand(Math.floor(remaining / 10000000)) + " Crore ";
    remaining = remaining % 10000000;
  }

  if (remaining >= 100000) {
    words += convertLessThanThousand(Math.floor(remaining / 100000)) + " Lakh ";
    remaining = remaining % 100000;
  }

  if (remaining >= 1000) {
    words +=
      convertLessThanThousand(Math.floor(remaining / 1000)) + " Thousand ";
    remaining = remaining % 1000;
  }

  if (remaining > 0) {
    words += convertLessThanThousand(remaining);
  }

  return words.trim() + " Rupees Only";
};

// Generate receipt number
const generateReceiptNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FEE-${timestamp}-${random}`;
};

// Upload file and create DB entry
const uploadAndCreateFileEntry = async (
  buffer,
  name,
  extension,
  contentType,
  createdBy,
) => {
  const fileId = crypto.randomUUID();
  const key = `${fileId}.${extension}`;

  await uploadFile({ buffer, key, contentType });

  const file = await prisma.file.create({
    data: {
      id: fileId,
      name,
      extension,
      contentType,
      size: buffer.length,
      createdBy,
    },
  });

  return file.id;
};

// Generate fee receipt HTML
const generateFeeReceiptHTML = async (
  installment,
  student,
  school,
  paymentAmount,
  previousPaidAmount,
  paymentMethod,
  isWaiver,
) => {
  const template = getFeeReceiptTemplate();

  const receiptDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const newPaidAmount = previousPaidAmount + paymentAmount;
  const remainingAmount = installment.amount - newPaidAmount;

  let paymentStatus;
  let statusClass;
  if (remainingAmount <= 0 && isWaiver) {
    paymentStatus = "WAIVED";
    statusClass = "paid";
  } else if (remainingAmount === 0) {
    paymentStatus = "PAID";
    statusClass = "paid";
  } else if (newPaidAmount > 0) {
    paymentStatus = "PARTIALLY PAID";
    statusClass = "partially_paid";
  } else {
    paymentStatus = "PENDING";
    statusClass = "pending";
  }

  const schoolAddress = school.address ? school.address.join(", ") : "N/A";
  const logoId = school.logoId || null;
  const logoSrc = logoId
    ? fileService.attachFileURL({ id: logoId, extension: "jpg" }).url
    : "";

  const studentName = `${student.firstName} ${student.lastName || ""}`.trim();
  const studentClass = student.studentProfile?.class
    ? `${student.studentProfile.class.grade}${student.studentProfile.class.division ? " - " + student.studentProfile.class.division : ""}`
    : "N/A";
  const fatherName = student.studentProfile?.fatherName || "N/A";

  // Replace all placeholders
  let html = template;

  // School placeholders
  html = html.replace(/\{\{school\.logoSrc\}\}/g, logoSrc);
  html = html.replace(/\{\{school\.name\}\}/g, school.name || "School");
  html = html.replace(/\{\{school\.address\}\}/g, schoolAddress);

  // Receipt placeholders
  html = html.replace(/\{\{receipt\.number\}\}/g, generateReceiptNumber());
  html = html.replace(/\{\{receipt\.date\}\}/g, receiptDate);
  html = html.replace(
    /\{\{receipt\.year\}\}/g,
    new Date().getFullYear().toString(),
  );

  // Student placeholders
  html = html.replace(
    /\{\{student\.publicId\}\}/g,
    student.publicUserId || "N/A",
  );
  html = html.replace(/\{\{student\.name\}\}/g, studentName);
  html = html.replace(/\{\{student\.class\}\}/g, studentClass);
  html = html.replace(/\{\{student\.fatherName\}\}/g, fatherName);

  // Payment placeholders
  html = html.replace(
    /\{\{payment\.installmentNumber\}\}/g,
    installment.installementNumber.toString(),
  );
  html = html.replace(
    /\{\{payment\.installmentAmount\}\}/g,
    installment.amount.toLocaleString("en-IN"),
  );
  html = html.replace(
    /\{\{payment\.amountPaid\}\}/g,
    isWaiver ? "Waived" : paymentAmount.toLocaleString("en-IN"),
  );
  html = html.replace(
    /\{\{payment\.previouslyPaid\}\}/g,
    previousPaidAmount.toLocaleString("en-IN"),
  );
  html = html.replace(
    /\{\{payment\.remainingAmount\}\}/g,
    remainingAmount.toLocaleString("en-IN"),
  );
  html = html.replace(/\{\{payment\.status\}\}/g, paymentStatus);
  html = html.replace(/\{\{payment\.statusClass\}\}/g, statusClass);
  html = html.replace(
    /\{\{payment\.amountInWords\}\}/g,
    isWaiver ? "Waived" : numberToWords(paymentAmount),
  );
  const methodLabels = {
    CASH: "Cash (Offline)",
    CHEQUE: "Cheque (Offline)",
    UPI: "UPI (Online)",
    BANK_TRANSFER: "Bank Transfer (Online)",
  };
  const methodLabel = isWaiver ? "Fee Waiver" : (methodLabels[paymentMethod] || paymentMethod || "System");
  html = html.replace(/\{\{payment\.method\}\}/g, methodLabel);

  return html;
};

// Attach receipt URL to installments
const attachReceiptUrl = (installment) => {
  if (installment.receiptFileId) {
    installment.receiptFileUrl = fileService.attachFileURL({
      id: installment.receiptFileId,
      extension: "html",
    }).url;
  } else {
    installment.receiptFileUrl = null;
  }
  return installment;
};

const router = Router();

// GET fees overview
router.get(
  "/",
  withPermission(Permission.GET_FEES),
  async (req, res) => {
    const currentUser = req.context.user;

    if (!currentUser.schoolId) {
      return res.json({
        message: "Fees overview - school context required",
        data: {
          endpoints: {
            installments: "/fees/installments/:installmentNumber",
            student: "/fees/student/:studentId",
            recordPayment: "/fees/installments/:id/payment",
          },
          note: "These endpoints require school context. Use a school admin account or provide schoolId.",
        },
      });
    }

    const { academicYear } = req.query;
    const where = {
      schoolId: currentUser.schoolId,
      deletedAt: null,
    };

    const installmentsWhere = {
      schoolId: currentUser.schoolId,
      deletedAt: null,
    };

    // Apply academic year filter if provided
    if (academicYear && typeof academicYear === "string") {
      const parts = academicYear.split("-");
      if (parts.length === 2) {
        const startYear = parseInt(parts[0], 10);
        if (!isNaN(startYear)) {
          where.year = startYear;

          const endYearShort = parseInt(parts[1], 10);
          const endYear = endYearShort < 100 ? 2000 + endYearShort : endYearShort;
          if (!isNaN(endYear)) {
            installmentsWhere.createdAt = {
              gte: new Date(`${startYear}-04-01T00:00:00.000Z`),
              lte: new Date(`${endYear}-03-31T23:59:59.999Z`),
            };
          }
        }
      }
    }

    // Get total fee statistics for the school
    const totalFees = await prisma.fee.count({
      where,
    });

    const totalInstallments = await prisma.feeInstallements.count({
      where: installmentsWhere,
    });

    const paidInstallments = await prisma.feeInstallements.count({
      where: {
        ...installmentsWhere,
        paymentStatus: FeePaymentStatus.PAID,
      },
    });

    return res.json({
      message: "Fees overview fetched!",
      data: {
        totalFees,
        totalInstallments,
        paidInstallments,
        pendingInstallments: totalInstallments - paidInstallments,
        endpoints: {
          installments: "/fees/installments/:installmentNumber",
          student: "/fees/student/:studentId",
          recordPayment: "/fees/installments/:id/payment",
        },
      },
    });
  },
);

// Mobile API: GET /fees/status – fee status summary (totalAmount, paidAmount, pendingAmount, installments)
router.get(
  "/status",
  withPermission(Permission.GET_FEES),
  async (req, res) => {
    const currentUser = req.context.user;
    const { studentId: queryStudentId, year } = req.query;

    let studentId = queryStudentId || (currentUser.role?.name === "STUDENT" ? currentUser.id : null);
    if (!studentId) {
      return res.status(400).json({
        message: "Provide studentId query or use a student account to get fee status",
      });
    }

    let schoolId = currentUser.schoolId;
    if (!schoolId && currentUser.role?.name === "STUDENT" && studentId === currentUser.id) {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: currentUser.id },
        include: { class: { select: { schoolId: true } } },
      });
      if (profile?.class) schoolId = profile.class.schoolId;
    }
    if (!schoolId) {
      return res.status(400).json({
        message: "School context required for fee status",
      });
    }

    const fee = await prisma.fee.findFirst({
      where: {
        studentId,
        schoolId,
        deletedAt: null,
        ...(year ? { year: parseInt(year, 10) } : {}),
      },
    });
    if (!fee) {
      return res.status(404).json({
        message: "Fee record not found for this student",
      });
    }
    const installments = await prisma.feeInstallements.findMany({
      where: { feeId: fee.id, deletedAt: null },
      orderBy: { installementNumber: "asc" },
    });
    const installmentsWithUrls = installments.map(attachReceiptUrl);
    return res.json({
      message: "Fee status fetched successfully",
      data: {
        totalAmount: fee.totalAmount,
        paidAmount: fee.totalPaidAmount ?? 0,
        pendingAmount: fee.totalRemainingAmount ?? fee.totalAmount - (fee.totalPaidAmount ?? 0),
        installments: installmentsWithUrls.map((i) => ({
          installmentNumber: i.installementNumber,
          amount: i.amount,
          status: i.paymentStatus,
          paymentDate: i.paidAt,
          dueDate: i.dueDate,
          paidAmount: i.paidAmount,
          remainingAmount: i.remainingAmount,
        })),
      },
    });
  },
);

// GET fee installments by installment number (from URL param)
router.get(
  "/installments/:installmentNumber",
  withPermission(Permission.GET_FEES),
  validateRequest(getInstallmentsSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const { installmentNumber } = req.params;
    const installmentNum = parseInt(installmentNumber, 10);
    const endInstallmentNum = req.query.end ? parseInt(req.query.end, 10) : installmentNum;

    if (!currentUser.schoolId) {
      return res
        .status(400)
        .json({ message: "User is not associated with a school!" });
    }

    if (isNaN(installmentNum) || installmentNum < 1) {
      return res.status(400).json({ message: "Invalid installment number!" });
    }

    const { academicYear } = req.query;

    const where = {
      schoolId: currentUser.schoolId,
      installementNumber: {
        gte: installmentNum,
        lte: isNaN(endInstallmentNum) ? installmentNum : endInstallmentNum,
      },
      deletedAt: null,
    };

    // Apply academic year filter if provided
    if (academicYear && typeof academicYear === "string") {
      const parts = academicYear.split("-");
      if (parts.length === 2) {
        const startYear = parseInt(parts[0], 10);
        const endYearShort = parseInt(parts[1], 10);
        const endYear = endYearShort < 100 ? 2000 + endYearShort : endYearShort;
        if (!isNaN(startYear) && !isNaN(endYear)) {
          where.createdAt = {
            gte: new Date(`${startYear}-04-01T00:00:00.000Z`),
            lte: new Date(`${endYear}-03-31T23:59:59.999Z`),
          };
        }
      }
    }

    // Get all fee installments for the specified installment number range
    const installments = await prisma.feeInstallements.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Get student details for each installment
    const studentIds = [
      ...new Set(installments.map((i) => i.studentId).filter(Boolean)),
    ];
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        publicUserId: true,
        studentProfile: {
          select: {
            rollNumber: true,
            class: {
              select: {
                grade: true,
                division: true,
              },
            },
          },
        },
      },
    });

    const studentMap = students.reduce((acc, student) => {
      acc[student.id] = student;
      return acc;
    }, {});

    const installmentsWithStudents = installments.map((installment) => {
      const enriched = attachReceiptUrl({ ...installment });
      return {
        ...enriched,
        student: installment.studentId
          ? studentMap[installment.studentId] || null
          : null,
      };
    });

    return res.json({
      message: "Fee installments fetched!",
      data: {
        installmentNumber: installmentNum,
        installments: installmentsWithStudents,
      },
    });
  },
);

// GET all fee installments for a specific student
router.get(
  "/student/:studentId",
  withPermission(Permission.GET_FEES),
  validateRequest(getStudentInstallmentsSchema),
  async (req, res) => {
    const { studentId } = req.params;
    const currentUser = req.context.user;

    if (!currentUser.schoolId) {
      return res
        .status(400)
        .json({ message: "User is not associated with a school!" });
    }

    // Verify the student exists and belongs to the same school
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: currentUser.schoolId,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        publicUserId: true,
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found!" });
    }

    // Get the fee record for the student
    const fee = await prisma.fee.findFirst({
      where: {
        studentId,
        schoolId: currentUser.schoolId,
        deletedAt: null,
      },
    });

    if (!fee) {
      return res
        .status(404)
        .json({ message: "Fee record not found for this student!" });
    }

    // Get all installments for this fee
    const installments = await prisma.feeInstallements.findMany({
      where: {
        feeId: fee.id,
        deletedAt: null,
      },
      orderBy: { installementNumber: "asc" },
    });

    // Attach receipt URLs
    const installmentsWithReceipts = installments.map(attachReceiptUrl);

    return res.json({
      message: "Student fee installments fetched!",
      data: {
        student,
        fee,
        installments: installmentsWithReceipts,
      },
    });
  },
);

// PATCH - Record payment for a fee installment
router.post(
  "/request-otp",
  withPermission(Permission.RECORD_FEE_PAYMENT),
  async (req, res) => {
    const currentUser = req.context.user;
    try {
      await otpService.createAndSendOTP(currentUser.email, "fee-payment");
      const maskedEmail = currentUser.email.replace(
        /^(.{2})(.*)(@.*)$/,
        (_, start, middle, domain) => start + "*".repeat(Math.min(middle.length, 6)) + domain
      );
      return res.json({
        message: "OTP sent to your registered email.",
        data: { email: maskedEmail },
      });
    } catch (error) {
      logger.error({ error, userId: currentUser.id }, "Failed to send fee payment OTP");
      return res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }
  }
);

router.patch(
  "/installments/:id/payment",
  withPermission(Permission.RECORD_FEE_PAYMENT),
  validateRequest(recordPaymentSchema),
  async (req, res) => {
    const { id } = req.params;
    const { amount, paymentMethod, isWaiver, transactionId, remarks, otp } = req.body.request;
    const currentUser = req.context.user;

    // Verify OTP
    const otpVerification = await otpService.verifyOTP(currentUser.email, otp, "fee-payment");
    if (!otpVerification.valid) {
      return res.status(400).json({ message: otpVerification.message });
    }

    if (!currentUser.schoolId) {
      return res
        .status(400)
        .json({ message: "User is not associated with a school!" });
    }

    // Find the installment
    const installment = await prisma.feeInstallements.findFirst({
      where: {
        id,
        schoolId: currentUser.schoolId,
        deletedAt: null,
      },
    });

    if (!installment) {
      return res.status(404).json({ message: "Fee installment not found!" });
    }

    // Validate payment amount (if not a waiver)
    if (!isWaiver) {
      if (amount <= 0) {
        return res
          .status(400)
          .json({ message: "Payment amount must be greater than 0!" });
      }

      if (amount > installment.remainingAmount) {
        return res.status(400).json({
          message: `Payment amount cannot exceed remaining amount of ${installment.remainingAmount}!`,
        });
      }
    }

    // Get student and school details for receipt generation
    const [student, school] = await Promise.all([
      prisma.user.findFirst({
        where: { id: installment.studentId, deletedAt: null },
        include: {
          studentProfile: {
            include: {
              class: true,
            },
          },
        },
      }),
      prisma.school.findFirst({
        where: { id: installment.schoolId, deletedAt: null },
      }),
    ]);

    const appliedAmount = isWaiver ? installment.remainingAmount : amount;
    const previousPaidAmount = installment.paidAmount;
    const newPaidAmount = installment.paidAmount + appliedAmount;
    const newRemainingAmount = installment.remainingAmount - appliedAmount;

    // Determine new payment status
    let newPaymentStatus;
    if (newRemainingAmount === 0) {
      newPaymentStatus = FeePaymentStatus.PAID;
    } else if (newPaidAmount > 0) {
      newPaymentStatus = FeePaymentStatus.PARTIALLY_PAID;
    } else {
      newPaymentStatus = FeePaymentStatus.PENDING;
    }

    let receiptFileId = null;
    try {
      const receiptHTML = await generateFeeReceiptHTML(
        installment,
        student,
        school,
        appliedAmount,
        previousPaidAmount,
        paymentMethod || "System",
        isWaiver || false,
      );

      receiptFileId = await uploadAndCreateFileEntry(
        Buffer.from(receiptHTML, "utf-8"),
        `fee-receipt-${installment.id}-${Date.now()}`,
        "html",
        "text/html",
        currentUser.id,
      );
    } catch (error) {
      logger.error(`Failed to generate fee receipt: ${error.message}`, error);
      // Continue with payment recording even if receipt generation fails
    }

    // Record payment using service
    const result = await feeService.recordPayment(
      id,
      appliedAmount,
      paymentMethod,
      receiptFileId,
      currentUser.id,
      transactionId,
      remarks
    );

    // Attach receipt URL to response
    const responseData = attachReceiptUrl({ ...result.installment });

    return res.json({
      message: "Payment recorded successfully!",
      data: {
        installment: responseData,
        fee: result.fee,
      },
    });
  },
);

// GET all fees export as CSV
router.get(
  "/export",
  withPermission(Permission.GET_FEES),
  async (req, res) => {
    try {
      const currentUser = req.context.user;
      const { academicYear } = req.query;

      const where = {
        schoolId: currentUser.schoolId,
        deletedAt: null,
      };

      // Apply academic year filter if provided
      if (academicYear && typeof academicYear === "string") {
        const parts = academicYear.split("-");
        if (parts.length === 2) {
          const startYear = parseInt(parts[0], 10);
          const endYearShort = parseInt(parts[1], 10);
          const endYear = endYearShort < 100 ? 2000 + endYearShort : endYearShort;
          if (!isNaN(startYear) && !isNaN(endYear)) {
            where.createdAt = {
              gte: new Date(`${startYear}-04-01T00:00:00.000Z`),
              lte: new Date(`${endYear}-03-31T23:59:59.999Z`),
            };
          }
        }
      }

      const installments = await prisma.feeInstallements.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      // Manually fetch student details for each installment (Prisma relations missing for FeeInstallements)
      const studentIds = [
        ...new Set(installments.map((i) => i.studentId).filter(Boolean)),
      ];

      const students = await prisma.user.findMany({
        where: {
          id: { in: studentIds },
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          publicUserId: true,
          studentProfile: {
            select: {
              rollNumber: true,
              class: {
                select: {
                  grade: true,
                  division: true,
                },
              },
            },
          },
        },
      });

      const studentMap = students.reduce((acc, student) => {
        acc[student.id] = student;
        return acc;
      }, {});

      const headers = [
        "Receipt No", "Installment No", "Student ID", "Roll No", "Name",
        "Class", "Amount", "Paid At", "Status", "Payment Method"
      ];

      const rows = installments.map((i) => {
        const student = i.studentId ? studentMap[i.studentId] : null;
        return [
          i.id?.slice(0, 8) || "N/A",
          i.installementNumber || "N/A",
          student?.publicUserId || "N/A",
          student?.studentProfile?.rollNumber || "N/A",
          `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || "N/A",
          student?.studentProfile?.class ? `${student.studentProfile.class.grade}${student.studentProfile.class.division ? `-${student.studentProfile.class.division}` : ""}` : "N/A",
          i.paidAmount || 0,
          i.paidAt ? new Date(i.paidAt).toLocaleDateString("en-IN") : "N/A",
          i.paymentStatus || "N/A",
          i.paymentMethod || "N/A"
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=fees_report.csv");
      return res.send(csvContent);
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to export fees",
      });
    }
  }
);

export default router;

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
  if (remainingAmount === 0) {
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
    paymentAmount.toLocaleString("en-IN"),
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
    numberToWords(paymentAmount),
  );

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

    // Get total fee statistics for the school
    const totalFees = await prisma.fee.count({
      where: {
        schoolId: currentUser.schoolId,
        deletedAt: null,
      },
    });

    const totalInstallments = await prisma.feeInstallements.count({
      where: {
        schoolId: currentUser.schoolId,
        deletedAt: null,
      },
    });

    const paidInstallments = await prisma.feeInstallements.count({
      where: {
        schoolId: currentUser.schoolId,
        paymentStatus: FeePaymentStatus.PAID,
        deletedAt: null,
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

// GET fee installments by installment number (from URL param)
router.get(
  "/installments/:installmentNumber",
  withPermission(Permission.GET_FEES),
  validateRequest(getInstallmentsSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const { installmentNumber } = req.params;
    const installmentNum = parseInt(installmentNumber, 10);

    if (!currentUser.schoolId) {
      return res
        .status(400)
        .json({ message: "User is not associated with a school!" });
    }

    if (isNaN(installmentNum) || installmentNum < 1) {
      return res.status(400).json({ message: "Invalid installment number!" });
    }

    // Get all fee installments for the specified installment number
    const installments = await prisma.feeInstallements.findMany({
      where: {
        schoolId: currentUser.schoolId,
        installementNumber: installmentNum,
        deletedAt: null,
      },
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
router.patch(
  "/installments/:id/payment",
  withPermission(Permission.RECORD_FEE_PAYMENT),
  validateRequest(recordPaymentSchema),
  async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body.request;
    const currentUser = req.context.user;

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

    // Validate payment amount
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

    // Calculate new values
    const previousPaidAmount = installment.paidAmount;
    const newPaidAmount = installment.paidAmount + amount;
    const newRemainingAmount = installment.remainingAmount - amount;

    // Determine new payment status
    let newPaymentStatus;
    if (newRemainingAmount === 0) {
      newPaymentStatus = FeePaymentStatus.PAID;
    } else if (newPaidAmount > 0) {
      newPaymentStatus = FeePaymentStatus.PARTIALLY_PAID;
    } else {
      newPaymentStatus = FeePaymentStatus.PENDING;
    }

    // Generate receipt HTML and save as file
    let receiptFileId = null;
    try {
      const receiptHTML = await generateFeeReceiptHTML(
        installment,
        student,
        school,
        amount,
        previousPaidAmount,
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

    // Update installment and fee in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the installment
      const updatedInstallment = await tx.feeInstallements.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          paymentStatus: newPaymentStatus,
          paidAt: new Date(),
          receiptFileId: receiptFileId,
          updatedBy: currentUser.id,
        },
      });

      // Update the parent Fee record totals
      if (installment.feeId) {
        const fee = await tx.fee.findUnique({
          where: { id: installment.feeId },
        });

        if (fee) {
          await tx.fee.update({
            where: { id: installment.feeId },
            data: {
              totalPaidAmount: fee.totalPaidAmount + amount,
              totalRemainingAmount: fee.totalRemainingAmount - amount,
              updatedBy: currentUser.id,
            },
          });
        }
      }

      return updatedInstallment;
    });

    // Attach receipt URL to response
    const responseData = attachReceiptUrl({ ...result });

    return res.json({
      message: "Payment recorded successfully!",
      data: responseData,
    });
  },
);

export default router;

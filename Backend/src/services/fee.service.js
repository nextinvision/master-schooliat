import prisma from "../prisma/client.js";
import { FeePaymentStatus } from "../prisma/generated/index.js";

/**
 * Creates Fee and FeeInstallements records for a student based on school settings
 * @param {string} studentId - The student's user ID
 * @param {string} schoolId - The school ID
 * @param {string} createdBy - The user ID creating the records
 * @returns {Promise<object>} The created Fee record with installments
 */
const createFeeInstallementsForStudent = async (
  studentId,
  schoolId,
  createdBy,
) => {
  // Get settings for the school
  const settings = await prisma.settings.findFirst({
    where: {
      schoolId,
      deletedAt: null,
    },
  });

  if (!settings) {
    throw new Error(
      "School settings not found. Please configure settings first.",
    );
  }

  const totalAmount = settings.studentFeeAmount || 0;
  const numberOfInstallments = settings.studentFeeInstallments || 12;
  const currentYear = new Date().getFullYear();

  // Calculate amount per installment (divide evenly, put remainder in first installment)
  const baseInstallmentAmount = Math.floor(totalAmount / numberOfInstallments);
  const remainder = totalAmount % numberOfInstallments;

  // Create Fee record and FeeInstallements in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the main Fee record
    const fee = await tx.fee.create({
      data: {
        schoolId,
        studentId,
        year: currentYear,
        totalAmount,
        totalPaidAmount: 0,
        totalRemainingAmount: totalAmount,
        createdBy,
      },
    });

    // Create FeeInstallements records
    const installmentsData = [];
    for (let i = 1; i <= numberOfInstallments; i++) {
      // First installment gets the remainder
      const installmentAmount =
        i === 1 ? baseInstallmentAmount + remainder : baseInstallmentAmount;

      installmentsData.push({
        feeId: fee.id,
        schoolId,
        studentId,
        installementNumber: i,
        paymentStatus: FeePaymentStatus.PENDING,
        amount: installmentAmount,
        remainingAmount: installmentAmount,
        paidAmount: 0,
        createdBy,
      });
    }

    await tx.feeInstallements.createMany({
      data: installmentsData,
    });

    // Fetch the created installments to return
    const installments = await tx.feeInstallements.findMany({
      where: { feeId: fee.id },
      orderBy: { installementNumber: "asc" },
    });

    return { ...fee, installments };
  });

  return result;
};

/**
 * Record fee payment
 * @param {string} installmentId - Installment ID
 * @param {number} amount - Payment amount
 * @param {string} paymentMethod - Payment method
 * @param {string} receiptFileId - Receipt file ID (optional)
 * @param {string} recordedBy - User ID recording payment
 * @returns {Promise<Object>} - Updated installment and fee
 */
const recordPayment = async (installmentId, amount, paymentMethod, receiptFileId, recordedBy) => {
  const installment = await prisma.feeInstallements.findUnique({
    where: { id: installmentId },
    include: {
      fee: true,
    },
  });

  if (!installment) {
    throw new Error("Installment not found");
  }

  // Calculate new amounts
  const newPaidAmount = installment.paidAmount + amount;
  const newRemainingAmount = installment.remainingAmount - amount;
  const newPaymentStatus = newRemainingAmount <= 0
    ? FeePaymentStatus.PAID
    : newPaidAmount > 0
      ? FeePaymentStatus.PARTIALLY_PAID
      : FeePaymentStatus.PENDING;

  // Update in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update installment
    const updatedInstallment = await tx.feeInstallements.update({
      where: { id: installmentId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paymentStatus: newPaymentStatus,
        paidAt: newRemainingAmount <= 0 ? new Date() : installment.paidAt,
        receiptFileId: receiptFileId || installment.receiptFileId,
        updatedBy: recordedBy,
      },
    });

    // Update fee totals
    const updatedFee = await tx.fee.update({
      where: { id: installment.feeId },
      data: {
        totalPaidAmount: {
          increment: amount,
        },
        totalRemainingAmount: {
          decrement: amount,
        },
        updatedBy: recordedBy,
      },
    });

    return { installment: updatedInstallment, fee: updatedFee };
  });

  return result;
};

/**
 * Calculate late fees
 * @param {string} installmentId - Installment ID
 * @param {Object} lateFeeConfig - Late fee configuration
 * @returns {Promise<number>} - Late fee amount
 */
const calculateLateFee = async (installmentId, lateFeeConfig) => {
  const installment = await prisma.feeInstallements.findUnique({
    where: { id: installmentId },
    include: {
      fee: true,
    },
  });

  if (!installment || installment.paymentStatus === FeePaymentStatus.PAID) {
    return 0;
  }

  // Get due date (assuming installments are monthly, starting from academic year)
  const currentDate = new Date();
  const academicYearStart = new Date(installment.fee.year, 3, 1); // April 1st
  const dueDate = new Date(academicYearStart);
  dueDate.setMonth(dueDate.getMonth() + installment.installementNumber - 1);

  // Add grace period
  const gracePeriodDays = lateFeeConfig.gracePeriodDays || 0;
  const finalDueDate = new Date(dueDate);
  finalDueDate.setDate(finalDueDate.getDate() + gracePeriodDays);

  if (currentDate <= finalDueDate) {
    return 0; // Within grace period
  }

  // Calculate days overdue
  const daysOverdue = Math.floor((currentDate - finalDueDate) / (1000 * 60 * 60 * 24));

  // Calculate late fee
  let lateFee = 0;
  if (lateFeeConfig.type === "FIXED") {
    lateFee = lateFeeConfig.amount || 0;
  } else if (lateFeeConfig.type === "PERCENTAGE") {
    lateFee = (installment.amount * (lateFeeConfig.percentage || 0)) / 100;
  } else if (lateFeeConfig.type === "PER_DAY") {
    lateFee = (lateFeeConfig.amountPerDay || 0) * daysOverdue;
  }

  return Math.round(lateFee);
};

/**
 * Apply scholarship or discount
 * @param {string} feeId - Fee ID
 * @param {number} discountAmount - Discount amount
 * @param {string} discountType - Discount type (SCHOLARSHIP, DISCOUNT, etc.)
 * @param {string} reason - Reason for discount
 * @param {string} appliedBy - User ID applying discount
 * @returns {Promise<Object>} - Updated fee
 */
const applyDiscount = async (feeId, discountAmount, discountType, reason, appliedBy) => {
  const fee = await prisma.fee.findUnique({
    where: { id: feeId },
  });

  if (!fee) {
    throw new Error("Fee not found");
  }

  // Reduce total amount and remaining amount
  const updated = await prisma.fee.update({
    where: { id: feeId },
    data: {
      totalAmount: {
        decrement: discountAmount,
      },
      totalRemainingAmount: {
        decrement: discountAmount,
      },
      updatedBy: appliedBy,
    },
  });

  // TODO: Store discount record in a separate table for audit
  logger.info({
    feeId,
    discountAmount,
    discountType,
    reason,
    appliedBy,
  }, "Discount applied to fee");

  return updated;
};

/**
 * Get fee analytics
 * @param {string} schoolId - School ID
 * @param {number} year - Academic year
 * @returns {Promise<Object>} - Fee analytics
 */
const getFeeAnalytics = async (schoolId, year) => {
  const [totalFees, totalPaid, totalPending, defaulterCount] = await Promise.all([
    prisma.fee.aggregate({
      where: {
        schoolId,
        year,
        deletedAt: null,
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.fee.aggregate({
      where: {
        schoolId,
        year,
        deletedAt: null,
      },
      _sum: {
        totalPaidAmount: true,
      },
    }),
    prisma.fee.aggregate({
      where: {
        schoolId,
        year,
        deletedAt: null,
      },
      _sum: {
        totalRemainingAmount: true,
      },
    }),
    prisma.fee.count({
      where: {
        schoolId,
        year,
        totalRemainingAmount: {
          gt: 0,
        },
        deletedAt: null,
      },
    }),
  ]);

  const collectionPercentage = totalFees._sum.totalAmount > 0
    ? (totalPaid._sum.totalPaidAmount / totalFees._sum.totalAmount) * 100
    : 0;

  return {
    totalFees: totalFees._sum.totalAmount || 0,
    totalPaid: totalPaid._sum.totalPaidAmount || 0,
    totalPending: totalPending._sum.totalRemainingAmount || 0,
    collectionPercentage: Math.round(collectionPercentage * 100) / 100,
    defaulterCount,
  };
};

/**
 * Get defaulters list
 * @param {string} schoolId - School ID
 * @param {number} year - Academic year
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Defaulters with pagination
 */
const getDefaulters = async (schoolId, year, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [defaulters, total] = await Promise.all([
    prisma.fee.findMany({
      where: {
        schoolId,
        year,
        totalRemainingAmount: {
          gt: 0,
        },
        deletedAt: null,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        },
      },
      orderBy: {
        totalRemainingAmount: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.fee.count({
      where: {
        schoolId,
        year,
        totalRemainingAmount: {
          gt: 0,
        },
        deletedAt: null,
      },
    }),
  ]);

  return {
    defaulters,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const feeService = {
  createFeeInstallementsForStudent,
  recordPayment,
  calculateLateFee,
  applyDiscount,
  getFeeAnalytics,
  getDefaulters,
};

export default feeService;

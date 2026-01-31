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

const feeService = {
  createFeeInstallementsForStudent,
};

export default feeService;

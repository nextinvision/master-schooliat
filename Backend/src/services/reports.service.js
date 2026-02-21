import prisma from "../prisma/client.js";
import logger from "../config/logger.js";

/**
 * Get attendance reports
 * @param {string} schoolId - School ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} - Attendance report data
 */
const getAttendanceReports = async (schoolId, filters = {}) => {
  const { classId = null, startDate = null, endDate = null, studentId = null } = filters;

  const where = {
    schoolId,
    deletedAt: null,
  };

  if (classId) {
    where.classId = classId;
  }

  if (studentId) {
    where.studentId = studentId;
  }

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: {
      student: {
        include: {
          studentProfile: {
            include: {
              class: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Calculate statistics
  const totalDays = attendance.length;
  const presentCount = attendance.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendance.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendance.filter((a) => a.status === "LATE").length;
  const totalStudents = new Set(attendance.map((a) => a.studentId)).size;
  const attendanceRate = totalDays > 0 ? (presentCount / totalDays) * 100 : 0;

  return {
    attendance,
    statistics: {
      totalDays,
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate: Number(attendanceRate.toFixed(2)),
      averageAttendance: Number(attendanceRate.toFixed(2)),
      totalPresent: presentCount,
      totalAbsent: absentCount,
    },
  };
};

/**
 * Get fee collection analytics
 * @param {string} schoolId - School ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} - Fee analytics
 */
const getFeeAnalytics = async (schoolId, filters = {}) => {
  const { startDate = null, endDate = null, studentId = null } = filters;

  const where = {
    schoolId,
    deletedAt: null,
  };

  if (studentId) {
    where.studentId = studentId;
  }

  const installments = await prisma.feeInstallements.findMany({
    where,
  });

  // Filter by date if provided (use createdAt or paidAt)
  let filteredInstallments = installments;
  if (startDate && endDate) {
    filteredInstallments = installments.filter((inst) => {
      const instDate = new Date(inst.createdAt || inst.paidAt || 0);
      return instDate >= new Date(startDate) && instDate <= new Date(endDate);
    });
  }

  // Use paymentStatus (schema field), not status
  const totalAmount = filteredInstallments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
  const paidAmount = filteredInstallments
    .filter((inst) => inst.paymentStatus === "PAID")
    .reduce((sum, inst) => sum + Number(inst.paidAmount != null ? inst.paidAmount : (inst.amount || 0)), 0);
  const pendingAmount = filteredInstallments
    .filter((inst) => inst.paymentStatus === "PENDING")
    .reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
  const overdueAmount = filteredInstallments
    .filter((inst) => inst.paymentStatus === "PENDING" && inst.paidAt == null && new Date(inst.createdAt) < new Date())
    .reduce((sum, inst) => sum + Number(inst.amount || 0), 0);

  const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  return {
    installments: filteredInstallments,
    statistics: {
      totalAmount,
      totalRevenue: totalAmount,
      paidAmount,
      totalPaid: paidAmount,
      pendingAmount,
      totalPending: pendingAmount,
      overdueAmount,
      collectionRate: Number(collectionRate.toFixed(2)),
      totalInstallments: filteredInstallments.length,
      paidInstallments: filteredInstallments.filter((inst) => inst.paymentStatus === "PAID").length,
      pendingInstallments: filteredInstallments.filter((inst) => inst.paymentStatus === "PENDING").length,
    },
  };
};

/**
 * Get academic performance reports
 * @param {string} schoolId - School ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} - Academic performance data
 */
const getAcademicReports = async (schoolId, filters = {}) => {
  const { classId = null, examId = null, subjectId = null, studentId = null } = filters;

  const where = {
    schoolId,
    deletedAt: null,
  };

  if (classId) {
    where.classId = classId;
  }

  if (examId) {
    where.examId = examId;
  }

  if (subjectId) {
    where.subjectId = subjectId;
  }

  if (studentId) {
    where.studentId = studentId;
  }

  const marks = await prisma.marks.findMany({
    where,
    include: {
      student: {
        include: {
          studentProfile: {
            include: {
              class: true,
            },
          },
        },
      },
      exam: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate statistics
  const totalStudents = new Set(marks.map((m) => m.studentId)).size;
  const averagePercentage =
    marks.length > 0
      ? marks.reduce((sum, m) => sum + Number(m.percentage || 0), 0) / marks.length
      : 0;

  const passCount = marks.filter((m) => {
    const percentage = Number(m.percentage || 0);
    return percentage >= 40; // Assuming 40% is passing
  }).length;

  const failCount = marks.length - passCount;
  const topPerformers = marks.filter((m) => Number(m.percentage || 0) >= 80).length;
  const passRateNum = marks.length > 0 ? (passCount / marks.length) * 100 : 0;

  return {
    marks,
    statistics: {
      totalStudents,
      totalMarks: marks.length,
      averagePercentage: Number(averagePercentage.toFixed(2)),
      averageScore: Number(averagePercentage.toFixed(2)),
      passCount,
      failCount,
      passRate: Number(passRateNum.toFixed(2)),
      topPerformers,
    },
  };
};

/**
 * Get salary/expense reports
 * SalaryPayments has: schoolId, userId (teacher_id), month (YYYY-MM), totalAmount, createdAt (no paymentDate/employee relation)
 * @param {string} schoolId - School ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} - Salary reports
 */
const getSalaryReports = async (schoolId, filters = {}) => {
  if (!schoolId) {
    throw new Error("School context is required for salary reports");
  }

  const { startDate = null, endDate = null } = filters;

  const where = {
    schoolId,
    deletedAt: null,
  };

  const payments = await prisma.salaryPayments.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  // Filter by date: use month (YYYY-MM) or createdAt
  let filteredPayments = payments;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("Invalid start or end date for salary report");
    }
    filteredPayments = payments.filter((payment) => {
      const paymentDate = payment.createdAt;
      return paymentDate >= start && paymentDate <= end;
    });
  }

  // Resolve user names for display (SalaryPayments has userId = teacher_id)
  const userIds = [...new Set(filteredPayments.map((p) => p.userId))];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.id]));

  const paymentsForResponse = filteredPayments.map((p) => ({
    ...p,
    amount: Number(p.totalAmount || 0),
    employeeName: userMap[p.userId] || p.userId,
    paymentDate: p.createdAt,
  }));

  const totalSalary = paymentsForResponse.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalEmployees = new Set(paymentsForResponse.map((p) => p.userId)).size;

  return {
    payments: paymentsForResponse,
    statistics: {
      totalSalary,
      totalPaid: totalSalary,
      totalEmployees,
      totalPayments: paymentsForResponse.length,
      averageSalary: paymentsForResponse.length > 0 ? totalSalary / paymentsForResponse.length : 0,
      pendingPayments: 0,
    },
  };
};

const reportsService = {
  getAttendanceReports,
  getFeeAnalytics,
  getAcademicReports,
  getSalaryReports,
};

export default reportsService;


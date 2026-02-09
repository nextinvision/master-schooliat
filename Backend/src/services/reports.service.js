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

  const attendanceRate = totalDays > 0 ? (presentCount / totalDays) * 100 : 0;

  return {
    attendance,
    statistics: {
      totalDays,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate: attendanceRate.toFixed(2),
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
  const { startDate = null, endDate = null, classId = null } = filters;

  const where = {
    schoolId,
    deletedAt: null,
  };

  if (classId) {
    where.classId = classId;
  }

  const installments = await prisma.feeInstallements.findMany({
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
  });

  // Filter by date if provided
  let filteredInstallments = installments;
  if (startDate && endDate) {
    filteredInstallments = installments.filter((inst) => {
      const instDate = new Date(inst.dueDate);
      return instDate >= new Date(startDate) && instDate <= new Date(endDate);
    });
  }

  // Calculate statistics
  const totalAmount = filteredInstallments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
  const paidAmount = filteredInstallments
    .filter((inst) => inst.status === "PAID")
    .reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
  const pendingAmount = filteredInstallments
    .filter((inst) => inst.status === "PENDING")
    .reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
  const overdueAmount = filteredInstallments
    .filter((inst) => {
      const dueDate = new Date(inst.dueDate);
      return inst.status === "PENDING" && dueDate < new Date();
    })
    .reduce((sum, inst) => sum + Number(inst.amount || 0), 0);

  const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  return {
    installments: filteredInstallments,
    statistics: {
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      collectionRate: collectionRate.toFixed(2),
      totalInstallments: filteredInstallments.length,
      paidInstallments: filteredInstallments.filter((inst) => inst.status === "PAID").length,
      pendingInstallments: filteredInstallments.filter((inst) => inst.status === "PENDING").length,
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

  return {
    marks,
    statistics: {
      totalStudents,
      totalMarks: marks.length,
      averagePercentage: averagePercentage.toFixed(2),
      passCount,
      failCount,
      passRate: marks.length > 0 ? ((passCount / marks.length) * 100).toFixed(2) : 0,
    },
  };
};

/**
 * Get salary/expense reports
 * @param {string} schoolId - School ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} - Salary reports
 */
const getSalaryReports = async (schoolId, filters = {}) => {
  const { startDate = null, endDate = null } = filters;

  const where = {
    schoolId,
    deletedAt: null,
  };

  const payments = await prisma.salaryPayments.findMany({
    where,
    include: {
      employee: {
        include: {
          teacherProfile: true,
        },
      },
      salaryStructure: true,
    },
    orderBy: {
      paymentDate: "desc",
    },
  });

  // Filter by date if provided
  let filteredPayments = payments;
  if (startDate && endDate) {
    filteredPayments = payments.filter((payment) => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
    });
  }

  // Calculate statistics
  const totalSalary = filteredPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );
  const totalEmployees = new Set(filteredPayments.map((p) => p.employeeId)).size;

  return {
    payments: filteredPayments,
    statistics: {
      totalSalary,
      totalEmployees,
      totalPayments: filteredPayments.length,
      averageSalary: filteredPayments.length > 0 ? totalSalary / filteredPayments.length : 0,
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


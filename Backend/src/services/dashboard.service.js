import prisma from "../prisma/client.js";
import {
  RoleName,
  UserType,
  Gender,
  FeePaymentStatus,
} from "../prisma/generated/index.js";
import roleService from "./role.service.js";
import dateUtil from "../utils/date.util.js";
import cacheService from "./cache.service.js";

const getDashboard = async (currentUser) => {
  const roleName = currentUser?.role?.name;

  if (roleName === RoleName.SUPER_ADMIN) {
    return await getSuperAdminDashboard();
  } else if (roleName === RoleName.SCHOOL_ADMIN) {
    return await getSchoolAdminDashboard(currentUser);
  }

  return {};
};

const getSuperAdminDashboard = async () => {
  // Cache dashboard for 5 minutes
  const cacheKey = "dashboard:super_admin";
  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      return await getSuperAdminDashboardData();
    },
    5 * 60 * 1000, // 5 minutes TTL
  );
};

const getSuperAdminDashboardData = async () => {
  // Get role IDs
  const studentRole = await roleService.getRoleByName(RoleName.STUDENT);
  const teacherRole = await roleService.getRoleByName(RoleName.TEACHER);
  const staffRole = await roleService.getRoleByName(RoleName.STAFF);
  const employeeRole = await roleService.getRoleByName(RoleName.EMPLOYEE);

  // Get counts
  const [
    totalSchools,
    totalEmployees,
    totalStudents,
    totalStaff,
    recentSchools,
  ] = await Promise.all([
    prisma.school.count({
      where: { deletedAt: null },
    }),
    prisma.user.count({
      where: {
        roleId: employeeRole?.id,
        userType: UserType.APP,
        deletedAt: null,
      },
    }),
    prisma.user.count({
      where: {
        roleId: studentRole?.id,
        userType: UserType.SCHOOL,
        deletedAt: null,
      },
    }),
    prisma.user.count({
      where: {
        roleId: { in: [teacherRole?.id, staffRole?.id].filter(Boolean) },
        userType: UserType.SCHOOL,
        deletedAt: null,
      },
    }),
    prisma.school.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);

  // Get student count for recent schools
  const recentSchoolsWithStats = await Promise.all(
    recentSchools.map(async (school) => {
      const studentCount = await prisma.user.count({
        where: {
          schoolId: school.id,
          roleId: studentRole?.id,
          userType: UserType.SCHOOL,
          deletedAt: null,
        },
      });

      return {
        ...school,
        students: studentCount,
        status: "Active",
      };
    }),
  );

  return {
    totalSchools,
    totalEmployees,
    totalStudents,
    totalStaff,
    recentSchools: recentSchoolsWithStats,
  };
};

const getSchoolAdminDashboard = async (currentUser) => {
  const schoolId = currentUser?.schoolId;

  if (!schoolId) {
    return {};
  }

  // Cache dashboard per school for 5 minutes
  const cacheKey = `dashboard:school_admin:${schoolId}`;
  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      return await getSchoolAdminDashboardData(currentUser, schoolId);
    },
    5 * 60 * 1000, // 5 minutes TTL
  );
};

const getSchoolAdminDashboardData = async (currentUser, schoolId) => {

  // Get role IDs
  const studentRole = await roleService.getRoleByName(RoleName.STUDENT);
  const teacherRole = await roleService.getRoleByName(RoleName.TEACHER);
  const staffRole = await roleService.getRoleByName(RoleName.STAFF);

  // Get current month date range
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = currentDate.getFullYear();
  const firstDayOfMonth = dateUtil.getFirstDayOfMonth(
    currentMonth,
    currentYear,
  );
  const lastDayOfMonth = dateUtil.getLastDayOfMonth(currentMonth, currentYear);

  // Get school settings to fetch current installment number
  const schoolSettings = await prisma.settings.findFirst({
    where: {
      schoolId,
      deletedAt: null,
    },
  });

  const currentInstallmentNumber =
    schoolSettings?.currentInstallmentNumber || 1;

  // Get fee IDs for the current year
  const currentYearFees = await prisma.fee.findMany({
    where: {
      schoolId,
      year: currentYear,
      deletedAt: null,
    },
    select: { id: true },
  });

  const currentYearFeeIds = currentYearFees.map((f) => f.id);

  // Get counts for the school
  const [
    totalStudents,
    totalStudentsBoys,
    totalStudentsGirls,
    totalTeachers,
    totalStaff,
    school,
    notices,
    paidInstallments,
    pendingInstallments,
    partialPaidInstallments,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        schoolId,
        roleId: studentRole?.id,
        userType: UserType.SCHOOL,
        deletedAt: null,
      },
    }),
    prisma.user.count({
      where: {
        schoolId,
        roleId: studentRole?.id,
        userType: UserType.SCHOOL,
        gender: Gender.MALE,
        deletedAt: null,
      },
    }),
    prisma.user.count({
      where: {
        schoolId,
        roleId: studentRole?.id,
        userType: UserType.SCHOOL,
        gender: Gender.FEMALE,
        deletedAt: null,
      },
    }),
    prisma.user.count({
      where: {
        schoolId,
        roleId: teacherRole?.id,
        userType: UserType.SCHOOL,
        deletedAt: null,
      },
    }),
    prisma.user.count({
      where: {
        schoolId,
        roleId: staffRole?.id,
        userType: UserType.SCHOOL,
        deletedAt: null,
      },
    }),
    prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
      },
    }),
    prisma.notice.findMany({
      where: {
        schoolId,
        deletedAt: null,
        // Filter notices that are visible during the current month
        visibleFrom: { lte: lastDayOfMonth },
        visibleTill: { gte: firstDayOfMonth },
      },
      select: {
        id: true,
        title: true,
        content: true,
        visibleFrom: true,
        visibleTill: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.feeInstallements.count({
      where: {
        schoolId,
        installementNumber: currentInstallmentNumber,
        paymentStatus: FeePaymentStatus.PAID,
        deletedAt: null,
        feeId: { in: currentYearFeeIds },
      },
    }),
    prisma.feeInstallements.count({
      where: {
        schoolId,
        installementNumber: currentInstallmentNumber,
        paymentStatus: FeePaymentStatus.PENDING,
        deletedAt: null,
        feeId: { in: currentYearFeeIds },
      },
    }),
    prisma.feeInstallements.count({
      where: {
        schoolId,
        installementNumber: currentInstallmentNumber,
        paymentStatus: FeePaymentStatus.PARTIALLY_PAID,
        deletedAt: null,
        feeId: { in: currentYearFeeIds },
      },
    }),
  ]);

  return {
    school,
    userCounts: {
      students: {
        total: totalStudents,
        boys: totalStudentsBoys,
        girls: totalStudentsGirls,
      },
      teachers: totalTeachers,
      staff: totalStaff,
    },
    installments: {
      currentYear,
      currentInstallmentNumber,
      paid: paidInstallments,
      pending: pendingInstallments,
      partiallyPaid: partialPaidInstallments,
    },
    notices,
  };
};

// Invalidate dashboard cache when data changes
const invalidateDashboardCache = (schoolId = null) => {
  if (schoolId) {
    cacheService.delete(`dashboard:school_admin:${schoolId}`);
  } else {
    cacheService.delete("dashboard:super_admin");
  }
};

const dashboardService = {
  getDashboard,
  getSuperAdminDashboard,
  getSchoolAdminDashboard,
  invalidateDashboardCache,
};

export default dashboardService;

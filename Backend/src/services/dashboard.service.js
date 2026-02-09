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
  } else if (roleName === RoleName.TEACHER) {
    return await getTeacherDashboard(currentUser);
  } else if (roleName === RoleName.STAFF) {
    return await getStaffDashboard(currentUser);
  } else if (roleName === RoleName.STUDENT) {
    return await getStudentDashboard(currentUser);
  } else if (roleName === RoleName.PARENT) {
    return await getParentDashboard(currentUser);
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

// Teacher Dashboard
const getTeacherDashboard = async (currentUser) => {
  const schoolId = currentUser?.schoolId;
  const teacherId = currentUser?.id;

  if (!schoolId || !teacherId) {
    return {};
  }

  const cacheKey = `dashboard:teacher:${teacherId}`;
  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      return await getTeacherDashboardData(schoolId, teacherId);
    },
    5 * 60 * 1000, // 5 minutes TTL
  );
};

const getTeacherDashboardData = async (schoolId, teacherId) => {
  const currentDate = new Date();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const [
    timetableSlots,
    pendingHomeworks,
    submittedHomeworks,
    upcomingExams,
    recentNotices,
  ] = await Promise.all([
    prisma.timetableSlot.findMany({
      where: {
        teacherId,
        deletedAt: null,
      },
      include: {
        timetable: {
          include: {
            class: true,
          },
        },
        subject: true,
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { periodNumber: "asc" },
      ],
    }),
    prisma.homework.findMany({
      where: {
        teacherId,
        dueDate: { gte: currentDate },
        deletedAt: null,
      },
      include: {
        subject: true,
        _count: {
          select: {
            submissions: {
              where: {
                status: "PENDING",
                deletedAt: null,
              },
            },
          },
        },
      },
      take: 5,
      orderBy: {
        dueDate: "asc",
      },
    }),
    prisma.homeworkSubmission.findMany({
      where: {
        homework: {
          teacherId,
          deletedAt: null,
        },
        status: "SUBMITTED",
        deletedAt: null,
      },
      include: {
        homework: {
          include: {
            subject: true,
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 10,
      orderBy: {
        submittedAt: "desc",
      },
    }),
    prisma.exam.findMany({
      where: {
        schoolId,
        startDate: { gte: currentDate },
        deletedAt: null,
      },
      include: {
        examCalendar: true,
      },
      take: 5,
      orderBy: {
        startDate: "asc",
      },
    }),
    prisma.notice.findMany({
      where: {
        schoolId,
        deletedAt: null,
        visibleFrom: { lte: currentDate },
        visibleTill: { gte: currentDate },
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    timetableSlots,
    pendingHomeworks,
    submittedHomeworks,
    upcomingExams,
    recentNotices,
  };
};

// Staff Dashboard
const getStaffDashboard = async (currentUser) => {
  const schoolId = currentUser?.schoolId;
  const staffId = currentUser?.id;

  if (!schoolId || !staffId) {
    return {};
  }

  const cacheKey = `dashboard:staff:${staffId}`;
  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      return await getStaffDashboardData(schoolId, staffId);
    },
    5 * 60 * 1000, // 5 minutes TTL
  );
};

const getStaffDashboardData = async (schoolId, staffId) => {
  const currentDate = new Date();

  const [
    recentNotices,
    upcomingEvents,
    recentCirculars,
  ] = await Promise.all([
    prisma.notice.findMany({
      where: {
        schoolId,
        deletedAt: null,
        visibleFrom: { lte: currentDate },
        visibleTill: { gte: currentDate },
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.event.findMany({
      where: {
        schoolId,
        startDate: { gte: currentDate },
        deletedAt: null,
      },
      take: 5,
      orderBy: {
        startDate: "asc",
      },
    }),
    prisma.circular.findMany({
      where: {
        schoolId,
        status: "PUBLISHED",
        deletedAt: null,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    recentNotices,
    upcomingEvents,
    recentCirculars,
  };
};

// Student Dashboard
const getStudentDashboard = async (currentUser) => {
  const schoolId = currentUser?.schoolId;
  const studentId = currentUser?.id;

  if (!schoolId || !studentId) {
    return {};
  }

  const cacheKey = `dashboard:student:${studentId}`;
  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      return await getStudentDashboardData(schoolId, studentId);
    },
    5 * 60 * 1000, // 5 minutes TTL
  );
};

const getStudentDashboardData = async (schoolId, studentId) => {
  const currentDate = new Date();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Get student profile to get class
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: studentId },
    include: {
      class: true,
    },
  });

  const classId = studentProfile?.classId;

  const [
    recentAttendance,
    pendingHomeworks,
    upcomingExams,
    recentResults,
    timetable,
    recentNotices,
    feeStatus,
  ] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        studentId,
        deletedAt: null,
      },
      take: 7,
      orderBy: {
        date: "desc",
      },
    }),
    prisma.homeworkSubmission.findMany({
      where: {
        studentId,
        status: "PENDING",
        deletedAt: null,
      },
      include: {
        homework: {
          include: {
            subject: true,
          },
        },
      },
      take: 5,
      orderBy: {
        homework: {
          dueDate: "asc",
        },
      },
    }),
    prisma.exam.findMany({
      where: {
        schoolId,
        startDate: { gte: currentDate },
        deletedAt: null,
      },
      include: {
        examCalendar: true,
      },
      take: 5,
      orderBy: {
        startDate: "asc",
      },
    }),
    prisma.result.findMany({
      where: {
        studentId,
        deletedAt: null,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    }),
    classId ? prisma.timetable.findFirst({
      where: {
        classId,
        schoolId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        slots: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: [
            { dayOfWeek: "asc" },
            { periodNumber: "asc" },
          ],
        },
      },
    }) : null,
    prisma.notice.findMany({
      where: {
        schoolId,
        deletedAt: null,
        visibleFrom: { lte: currentDate },
        visibleTill: { gte: currentDate },
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.feeInstallements.findMany({
      where: {
        studentId,
        paymentStatus: { in: ["PENDING", "PARTIALLY_PAID"] },
        deletedAt: null,
      },
      include: {
        fee: true,
      },
      take: 5,
      orderBy: {
        dueDate: "asc",
      },
    }),
  ]);

  return {
    recentAttendance,
    pendingHomeworks,
    upcomingExams,
    recentResults,
    timetable,
    recentNotices,
    feeStatus,
    class: studentProfile?.class,
  };
};

// Parent Dashboard
const getParentDashboard = async (currentUser) => {
  const parentId = currentUser?.id;

  if (!parentId) {
    return {};
  }

  const cacheKey = `dashboard:parent:${parentId}`;
  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      // Use parent service for consolidated dashboard
      const parentService = (await import("./parent.service.js")).default;
      return await parentService.getConsolidatedDashboard(parentId);
    },
    5 * 60 * 1000, // 5 minutes TTL
  );
};

// Invalidate dashboard cache when data changes
const invalidateDashboardCache = async (schoolId = null, userId = null, roleName = null) => {
  if (schoolId) {
    await cacheService.delete(`dashboard:school_admin:${schoolId}`);
  }
  if (userId && roleName) {
    await cacheService.delete(`dashboard:${roleName.toLowerCase()}:${userId}`);
  }
  if (!schoolId && !userId) {
    await cacheService.delete("dashboard:super_admin");
  }
};

const dashboardService = {
  getDashboard,
  getSuperAdminDashboard,
  getSchoolAdminDashboard,
  getTeacherDashboard,
  getStaffDashboard,
  getStudentDashboard,
  getParentDashboard,
  invalidateDashboardCache,
};

export default dashboardService;

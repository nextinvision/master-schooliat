import { Router } from "express";
import prisma from "../prisma/client.js";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission, RoleName, UserType } from "../prisma/generated/index.js";
import roleService from "../services/role.service.js";
import dashboardService from "../services/dashboard.service.js";
import paginateUtil from "../utils/paginate.util.js";

const router = Router();

router.get(
  "/",
  withPermission(Permission.GET_STATISTICS),
  async (req, res) => {
    return res.json({
      message: "Statistics endpoints available",
      data: {
        endpoints: [
          { path: "/statistics/schools", description: "Get school statistics" },
          { path: "/statistics/dashboard", description: "Get dashboard statistics" },
        ],
      },
    });
  },
);

router.get(
  "/schools",
  withPermission(Permission.GET_STATISTICS),
  async (req, res) => {
    const { search } = req.query;

    // Get all schools
    const where = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const schools = await prisma.school.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
      },
      ...paginateUtil.getPaginationParams(req),
    });

    // Get role IDs
    const studentRole = await roleService.getRoleByName(RoleName.STUDENT);
    const teacherRole = await roleService.getRoleByName(RoleName.TEACHER);
    const staffRole = await roleService.getRoleByName(RoleName.STAFF);
    const schoolAdminRole = await roleService.getRoleByName(
      RoleName.SCHOOL_ADMIN,
    );

    // Get all school IDs
    const schoolIds = schools.map((school) => school.id);

    // Optimized: Use groupBy to get counts for all schools in a single query per role
    // This eliminates N+1 query problem (was: 4 queries per school, now: 4 total queries)
    const [studentCounts, teacherCounts, staffCounts, adminCounts] =
      await Promise.all([
        // Students count grouped by schoolId
        prisma.user.groupBy({
          by: ["schoolId"],
          where: {
            schoolId: { in: schoolIds },
            roleId: studentRole?.id,
            userType: UserType.SCHOOL,
            deletedAt: null,
          },
          _count: {
            _all: true,
          },
        }),
        // Teachers count grouped by schoolId
        prisma.user.groupBy({
          by: ["schoolId"],
          where: {
            schoolId: { in: schoolIds },
            roleId: teacherRole?.id,
            userType: UserType.SCHOOL,
            deletedAt: null,
          },
          _count: {
            _all: true,
          },
        }),
        // Staff count grouped by schoolId
        prisma.user.groupBy({
          by: ["schoolId"],
          where: {
            schoolId: { in: schoolIds },
            roleId: staffRole?.id,
            userType: UserType.SCHOOL,
            deletedAt: null,
          },
          _count: {
            _all: true,
          },
        }),
        // Admin count grouped by schoolId
        prisma.user.groupBy({
          by: ["schoolId"],
          where: {
            schoolId: { in: schoolIds },
            roleId: schoolAdminRole?.id,
            userType: UserType.SCHOOL,
            deletedAt: null,
          },
          _count: {
            _all: true,
          },
        }),
      ]);

    // Create maps for O(1) lookup
    const studentCountMap = new Map(
      studentCounts.map((item) => [item.schoolId, item._count._all]),
    );
    const teacherCountMap = new Map(
      teacherCounts.map((item) => [item.schoolId, item._count._all]),
    );
    const staffCountMap = new Map(
      staffCounts.map((item) => [item.schoolId, item._count._all]),
    );
    const adminCountMap = new Map(
      adminCounts.map((item) => [item.schoolId, item._count._all]),
    );

    // Build statistics for each school using the maps
    const schoolStats = schools.map((school) => {
      const totalStudents = studentCountMap.get(school.id) || 0;
      const totalTeachers = teacherCountMap.get(school.id) || 0;
      const totalStaff = staffCountMap.get(school.id) || 0;
      const totalAdmin = adminCountMap.get(school.id) || 0;
      const totalStaffCount = totalTeachers + totalAdmin;

      return {
        ...school,
        totalStudents,
        totalStaff: totalStaffCount,
        teachers: totalTeachers,
        adminStaff: totalAdmin,
        status: "Active",
      };
    });

    // Calculate totals
    const totals = schoolStats.reduce(
      (acc, stat) => ({
        totalStudents: acc.totalStudents + stat.totalStudents,
        totalStaff: acc.totalStaff + stat.totalStaff,
        totalTeachers: acc.totalTeachers + stat.teachers,
        totalAdminStaff: acc.totalAdminStaff + stat.adminStaff,
      }),
      {
        totalStudents: 0,
        totalStaff: 0,
        totalTeachers: 0,
        totalAdminStaff: 0,
      },
    );

    return res.json({
      message: "School statistics fetched!",
      data: {
        schools: schoolStats,
        totals,
      },
    });
  },
);

router.get(
  "/dashboard",
  withPermission(Permission.GET_DASHBOARD_STATS),
  async (req, res) => {
    const currentUser = req.context.user;
    const data = await dashboardService.getDashboard(currentUser);

    return res.json({
      message: "Dashboard statistics fetched!",
      data,
    });
  },
);

export default router;

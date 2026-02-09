import prisma from "../prisma/client.js";
import { RoleName, Permission } from "../prisma/generated/index.js";
import logger from "../config/logger.js";
import cacheService from "./cache.service.js";

const getRoleByName = async (roleName) => {
  // Cache roles for 1 hour (roles rarely change)
  const cacheKey = `role:${roleName}`;
  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      return await prisma.role.findUnique({
        where: { name: roleName },
      });
    },
    60 * 60 * 1000, // 1 hour TTL
  );
};

const getExistingRolesNames = async () => {
  const roles = await prisma.role.findMany();
  return roles.map((role) => role.name);
};

const createDefaultRoles = async () => {
  const defaultRolePermissionsMap = {
    // App Roles
    [RoleName.SUPER_ADMIN]: [
      Permission.CREATE_EMPLOYEE,
      Permission.GET_EMPLOYEES,
      Permission.EDIT_EMPLOYEE,
      Permission.DELETE_EMPLOYEE,
      Permission.CREATE_SCHOOL,
      Permission.GET_SCHOOLS,
      Permission.EDIT_SCHOOL,
      Permission.DELETE_SCHOOL,
      Permission.CREATE_VENDOR,
      Permission.GET_VENDORS,
      Permission.EDIT_VENDOR,
      Permission.DELETE_VENDOR,
      Permission.CREATE_REGION,
      Permission.GET_REGIONS,
      Permission.EDIT_REGION,
      Permission.DELETE_REGION,
      Permission.GET_ROLES,
      Permission.GET_STATISTICS,
      Permission.GET_DASHBOARD_STATS,
      Permission.GET_USERS,
      Permission.CREATE_LICENSE,
      Permission.GET_LICENSES,
      Permission.UPDATE_LICENSE,
      Permission.DELETE_LICENSE,
      Permission.CREATE_RECEIPT,
      Permission.GET_RECEIPTS,
      Permission.UPDATE_RECEIPT,
      Permission.DELETE_RECEIPT,
      Permission.CREATE_LOCATION,
      Permission.GET_LOCATIONS,
      Permission.DELETE_LOCATION,
      Permission.GET_GRIEVANCES,
      Permission.UPDATE_GRIEVANCE,
      Permission.ADD_GRIEVANCE_COMMENT,
      Permission.GET_MY_GRIEVANCES,
      Permission.GET_ID_CARDS,
      Permission.GET_FEES,
      Permission.GET_SETTINGS,
      Permission.VIEW_AUDIT_LOGS,
    ],
    [RoleName.EMPLOYEE]: [
      Permission.GET_SCHOOLS,
      Permission.GET_VENDORS,
      Permission.CREATE_VENDOR,
      Permission.EDIT_VENDOR,
      Permission.GET_REGIONS,
      Permission.CREATE_REGION,
      Permission.CREATE_SCHOOL,
      Permission.CREATE_GRIEVANCE,
      Permission.GET_MY_GRIEVANCES,
      Permission.ADD_GRIEVANCE_COMMENT,
    ],
    // School Roles
    [RoleName.SCHOOL_ADMIN]: [
      Permission.CREATE_STUDENT,
      Permission.GET_STUDENTS,
      Permission.EDIT_STUDENT,
      Permission.DELETE_STUDENT,
      Permission.CREATE_TEACHER,
      Permission.GET_TEACHERS,
      Permission.EDIT_TEACHER,
      Permission.DELETE_TEACHER,
      Permission.CREATE_CLASSES,
      Permission.GET_CLASSES,
      Permission.EDIT_CLASSES,
      Permission.DELETE_CLASSES,
      Permission.CREATE_TRANSPORT,
      Permission.GET_TRANSPORTS,
      Permission.EDIT_TRANSPORT,
      Permission.DELETE_TRANSPORT,
      Permission.GET_MY_SCHOOL,
      Permission.CREATE_EVENT,
      Permission.GET_EVENTS,
      Permission.EDIT_EVENT,
      Permission.DELETE_EVENT,
      Permission.CREATE_HOLIDAY,
      Permission.GET_HOLIDAYS,
      Permission.EDIT_HOLIDAY,
      Permission.DELETE_HOLIDAY,
      Permission.CREATE_EXAM_CALENDAR,
      Permission.GET_EXAM_CALENDARS,
      Permission.EDIT_EXAM_CALENDAR,
      Permission.DELETE_EXAM_CALENDAR,
      Permission.CREATE_NOTICE,
      Permission.GET_NOTICES,
      Permission.EDIT_NOTICE,
      Permission.DELETE_NOTICE,
      Permission.CREATE_EXAM,
      Permission.GET_EXAMS,
      Permission.EDIT_EXAM,
      Permission.DELETE_EXAM,
      Permission.GET_CALENDAR,
      Permission.MANAGE_ID_CARD_CONFIG,
      Permission.GENERATE_ID_CARDS,
      Permission.GET_ID_CARDS,
      Permission.GET_SETTINGS,
      Permission.EDIT_SETTINGS,
      Permission.GET_FEES,
      Permission.RECORD_FEE_PAYMENT,
      Permission.CREATE_GRIEVANCE,
      Permission.GET_MY_GRIEVANCES,
      Permission.ADD_GRIEVANCE_COMMENT,
      Permission.GET_DASHBOARD_STATS,
      Permission.VIEW_AUDIT_LOGS,
    ],
    [RoleName.STUDENT]: [
      Permission.GET_MY_SCHOOL,
      Permission.GET_EVENTS,
      Permission.GET_HOLIDAYS,
      Permission.GET_EXAM_CALENDARS,
      Permission.GET_NOTICES,
      Permission.GET_EXAMS,
      Permission.GET_CALENDAR,
      Permission.GET_DASHBOARD_STATS,
    ],
    [RoleName.TEACHER]: [
      Permission.GET_STUDENTS,
      Permission.GET_CLASSES,
      Permission.GET_MY_SCHOOL,
      Permission.GET_EVENTS,
      Permission.GET_HOLIDAYS,
      Permission.GET_EXAM_CALENDARS,
      Permission.GET_NOTICES,
      Permission.GET_EXAMS,
      Permission.GET_CALENDAR,
      Permission.GET_DASHBOARD_STATS,
    ],
    [RoleName.STAFF]: [
      Permission.GET_MY_SCHOOL,
      Permission.GET_EVENTS,
      Permission.GET_HOLIDAYS,
      Permission.GET_EXAM_CALENDARS,
      Permission.GET_NOTICES,
      Permission.GET_EXAMS,
      Permission.GET_CALENDAR,
      Permission.GET_DASHBOARD_STATS,
    ],
  };

  let roleNames = [
    RoleName.SUPER_ADMIN,
    RoleName.EMPLOYEE,
    RoleName.SCHOOL_ADMIN,
    RoleName.STUDENT,
    RoleName.TEACHER,
    RoleName.STAFF,
  ];

  const existingRoleNames = await getExistingRolesNames();
  roleNames = roleNames.filter(
    (roleName) => !existingRoleNames.includes(roleName),
  );

  logger.info(`Exising Roles: ${JSON.stringify(existingRoleNames || [])}`);

  const roles = roleNames.map((roleName) => ({
    name: roleName,
    permissions: defaultRolePermissionsMap[roleName],
    createdBy: "system",
  }));

  logger.info(`Creating Roles: ${JSON.stringify(roleNames)}`);

  return await prisma.role.createManyAndReturn({
    data: roles,
    select: {
      id: true,
      name: true,
      permissions: true,
    },
  });
};

const roleService = {
  getRoleByName,
  createDefaultRoles,
};

export default roleService;

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
      Permission.GET_GALLERIES,
      Permission.CREATE_GALLERY,
      Permission.EDIT_GALLERY,
      Permission.DELETE_GALLERY,
      Permission.UPLOAD_GALLERY_IMAGE,
      Permission.DELETE_GALLERY_IMAGE,
      Permission.GET_MESSAGES,
      Permission.SEND_MESSAGE,
      // Attendance permissions
      Permission.MARK_ATTENDANCE,
      Permission.GET_ATTENDANCE,
      Permission.EXPORT_ATTENDANCE,
      // Homework permissions
      Permission.CREATE_HOMEWORK,
      Permission.GET_HOMEWORK,
      Permission.EDIT_HOMEWORK,
      Permission.DELETE_HOMEWORK,
      Permission.SUBMIT_HOMEWORK,
      Permission.GRADE_HOMEWORK,
      // Marks & Results permissions
      Permission.ENTER_MARKS,
      Permission.GET_MARKS,
      Permission.EDIT_MARKS,
      Permission.PUBLISH_RESULTS,
      Permission.GET_RESULTS,
      // Leave permissions
      Permission.CREATE_LEAVE_REQUEST,
      Permission.GET_LEAVE_REQUESTS,
      Permission.APPROVE_LEAVE,
      Permission.REJECT_LEAVE,
      // Timetable permissions
      Permission.CREATE_TIMETABLE,
      Permission.GET_TIMETABLE,
      Permission.EDIT_TIMETABLE,
      Permission.DELETE_TIMETABLE,
      // Notes & Syllabus permissions
      Permission.CREATE_NOTE,
      Permission.EDIT_NOTE,
      Permission.GET_NOTES,
      Permission.DELETE_NOTE,
      Permission.CREATE_SYLLABUS,
      Permission.EDIT_SYLLABUS,
      Permission.GET_SYLLABUS,
      Permission.DELETE_SYLLABUS,
      // Circular permissions
      Permission.CREATE_CIRCULAR,
      Permission.EDIT_CIRCULAR,
      Permission.PUBLISH_CIRCULAR,
      Permission.GET_CIRCULARS,
      Permission.DELETE_CIRCULAR,
      // Library permissions
      Permission.CREATE_LIBRARY_BOOK,
      Permission.EDIT_LIBRARY_BOOK,
      Permission.GET_LIBRARY_BOOKS,
      Permission.ISSUE_LIBRARY_BOOK,
      Permission.RETURN_LIBRARY_BOOK,
      Permission.RESERVE_LIBRARY_BOOK,
      Permission.GET_LIBRARY_HISTORY,
      // Reports permissions
      Permission.GET_ATTENDANCE_REPORTS,
      Permission.GET_FEE_ANALYTICS,
      Permission.GET_ACADEMIC_REPORTS,
      Permission.GET_SALARY_REPORTS,
      // AI/Chatbot permissions
      Permission.USE_CHATBOT,
      Permission.GET_CHATBOT_HISTORY,
      Permission.MANAGE_FAQ,
      // Communication permissions
      Permission.CREATE_ANNOUNCEMENT,
      Permission.SEND_NOTIFICATION,
      // Transport Routes permissions
      Permission.MANAGE_ROUTES,
      Permission.GET_ROUTES,
      Permission.ASSIGN_STUDENTS_TO_ROUTE,
      // Parent features permissions
      Permission.GET_CHILDREN,
      Permission.GET_CHILD_DATA,
      Permission.GET_CONSOLIDATED_DASHBOARD,
      // Security permissions
      Permission.REQUEST_DELETION_OTP,
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

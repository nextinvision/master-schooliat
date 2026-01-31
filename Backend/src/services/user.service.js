import prisma from "../prisma/client.js";
import bcryptjs from "bcryptjs";
import { RoleName, UserType, Gender } from "../prisma/generated/index.js";
import roleService from "./role.service.js";
import fileService from "./file.service.js";
import logger from "../config/logger.js";
import stringUtil from "../utils/string.util.js";

const getUserSelect = (
  fetchStudentProfile = false,
  fetchTeacherProfile = false,
) => {
  const baseSelect = {
    id: true,
    email: true,
    userType: true,
    roleId: true,
    firstName: true,
    lastName: true,
    schoolId: true,
    assignedRegionId: true,
    address: true,
    aadhaarId: true,
    contact: true,
    gender: true,
    dateOfBirth: true,
    publicUserId: true,
    registrationPhotoId: true,
    idPhotoId: true,
  };

  const select = { ...baseSelect };

  if (fetchStudentProfile) {
    select.studentProfile = {
      select: {
        id: true,
        rollNumber: true,
        apaarId: true,
        classId: true,
        transportId: true,
        fatherName: true,
        motherName: true,
        fatherContact: true,
        motherContact: true,
        fatherOccupation: true,
        annualIncome: true,
        accommodationType: true,
        bloodGroup: true,
        class: {
          select: {
            id: true,
            grade: true,
            division: true,
          },
        },
        transport: {
          select: {
            id: true,
            type: true,
            vehicleNumber: true,
          },
        },
      },
    };
  }

  if (fetchTeacherProfile) {
    select.teacherProfile = {
      select: {
        id: true,
        designation: true,
        highestQualification: true,
        university: true,
        yearOfPassing: true,
        grade: true,
        transportId: true,
        panCardNumber: true,
        bloodGroup: true,
        transport: {
          select: {
            id: true,
            type: true,
            vehicleNumber: true,
          },
        },
      },
    };
  }

  return select;
};

// Convenience exports for different user types
const getStudentSelect = () => getUserSelect(true, false);
const getTeacherSelect = () => getUserSelect(false, true);
const getEmployeeSelect = () => ({
  ...getUserSelect(false, false),
  assignedRegion: {
    select: {
      id: true,
      name: true,
    },
  },
});

const createSuperAdmin = async () => {
  const superAdminRole = await roleService.getRoleByName(RoleName.SUPER_ADMIN);

  const existingSuperAdminUser = await prisma.user.findFirst({
    where: {
      roleId: superAdminRole.id,
    },
  });

  if (existingSuperAdminUser) {
    return logger.info("Super Admin Exists!");
  }
  const generatedPassword = stringUtil.generateRandomString(15);
  logger.info(
    `Generating super admin user with creds for super admin: ${JSON.stringify({
      email: "admin@schooliat.com",
      password: generatedPassword,
    })}`,
  );

  const user = await prisma.user.create({
    data: {
      email: "admin@schooliat.com",
      password: await bcryptjs.hash(generatedPassword, 10),
      roleId: superAdminRole.id,
      publicUserId: "ADMIN001",
      registrationPhotoId: "asdads",
      userType: UserType.APP,
      firstName: "App",
      lastName: "Admin User",
      gender: Gender.MALE,
      dateOfBirth: new Date("1990-01-01"),
      contact: "0000000000",
      address: [],
      createdBy: "system",
    },
  });
  logger.info("Admin User Created");
};

const createSchoolAdmin = async (school, currentUser) => {
  const { name, email } = school;

  const role = await roleService.getRoleByName(RoleName.SCHOOL_ADMIN);
  const generatedPassword = stringUtil.generateRandomString(15);

  logger.info(
    `Generating school admin user with creds for school admin of ${name}: ${JSON.stringify({ email, password: generatedPassword })}`,
  );

  const schoolAdmin = await prisma.user.create({
    data: {
      publicUserId: `${school.code}A0001`,
      firstName: school.code,
      lastName: "Admin",
      email,
      userType: UserType.SCHOOL,
      roleId: role.id,
      schoolId: school.id,
      password: await bcryptjs.hash(generatedPassword, 10),
      gender: Gender.MALE,
      dateOfBirth: new Date("1990-01-01"),
      contact: school.phone || "0000000000",
      address: school.address || [],
      createdBy: currentUser.id,
    },
    select: getUserSelect(false, false), // School admin doesn't have profile
  });

  return { ...schoolAdmin, password: generatedPassword };
};

const getEmployeeById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    select: getEmployeeSelect(),
  });
};

const attachFileURLs = async (users) => {
  // Handle both array and single user
  if (users.length === 0) return users;

  // Collect all file IDs
  const fileIds = new Set();
  users.forEach((user) => {
    if (user?.registrationPhotoId) fileIds.add(user.registrationPhotoId);
    if (user?.idPhotoId) fileIds.add(user.idPhotoId);
  });

  // Fetch all files in one go
  const files = await fileService.getFilesByIds(Array.from(fileIds));
  const fileUrlMap = new Map(files.map((file) => [file.id, file.url]));

  // Attach photo URLs to users
  users.forEach((user) => {
    if (user) {
      user.registrationPhotoUrl = user.registrationPhotoId
        ? fileUrlMap.get(user.registrationPhotoId) || null
        : null;
      user.idPhotoUrl = user.idPhotoId
        ? fileUrlMap.get(user.idPhotoId) || null
        : null;
    }
  });

  return users;
};

const userService = {
  createSuperAdmin,
  createSchoolAdmin,
  getUserSelect,
  getStudentSelect,
  getTeacherSelect,
  getEmployeeSelect,
  getEmployeeById,
  attachFileURLs,
};

export default userService;

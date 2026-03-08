import { Router } from "express";
import prisma from "../prisma/client.js";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission, RoleName, UserType } from "../prisma/generated/index.js";
import userService from "../services/user.service.js";
import validateRequest from "../middlewares/validate-request.middleware.js";
import paginateUtil from "../utils/paginate.util.js";
import bcryptjs from "bcryptjs";
import stringUtil from "../utils/string.util.js";
import fileService from "../services/file.service.js";
import roleService from "../services/role.service.js";
import csvUtil from "../utils/csv.util.js";

const router = Router();

// Create teacher
router.post(
  "/teachers",
  withPermission(Permission.CREATE_TEACHER),
  async (req, res) => {
    try {
      const request = req.body.request;
      const currentUser = req.context.user;

      // Validate school exists
      const school = await prisma.school.findUnique({
        where: { id: currentUser.schoolId },
      });

      if (!school) {
        return res.status(404).json({ message: "School not found!" });
      }

      // Get teacher role
      const teacherRole = await roleService.getRoleByName(RoleName.TEACHER);

      // Generate password
      const generatedPassword = stringUtil.generateRandomString(15);

      // Generate public user ID (format: SCHOOLCODE + T + 4 digits)
      const existingTeachers = await prisma.user.count({
        where: {
          schoolId: currentUser.schoolId,
          roleId: teacherRole.id,
        },
      });
      const publicUserId = `${school.code}T${String(existingTeachers + 1).padStart(4, "0")}`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: request.email.trim(),
          password: await bcryptjs.hash(generatedPassword, 10),
          firstName: request.firstName.trim(),
          lastName: request.lastName?.trim() || "",
          contact: request.contact.trim(),
          gender: request.gender,
          dateOfBirth: new Date(request.dateOfBirth),
          address: request.address || [],
          aadhaarId: request.aadhaarId?.trim() || null,
          userType: UserType.SCHOOL,
          roleId: teacherRole.id,
          schoolId: currentUser.schoolId,
          publicUserId,
          registrationPhotoId: request.registrationPhotoId || null,
          idPhotoId: request.idPhotoId || null,
          createdBy: currentUser.id,
        },
        select: userService.getTeacherSelect(),
      });

      // Create teacher profile
      await prisma.teacherProfile.create({
        data: {
          userId: user.id,
          designation: request.designation?.trim() || null,
          highestQualification: request.highestQualification?.trim() || "",
          university: request.university?.trim() || "",
          yearOfPassing: request.yearOfPassing ? parseInt(request.yearOfPassing) : 0,
          grade: request.grade?.trim() || "",
          transportId: request.transportId || null,
          panCardNumber: request.panCardNumber?.trim() || null,
          bloodGroup: request.bloodGroup || null,
          basicSalary: request.basicSalary !== undefined && request.basicSalary !== "" ? Number(request.basicSalary) : null,
          createdBy: currentUser.id,
        },
      });

      // Attach file URLs
      const usersWithUrls = await userService.attachFileURLs([user]);

      return res.status(201).json({
        message: "Teacher created!",
        data: { ...usersWithUrls[0], password: generatedPassword },
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "Email already exists!",
        });
      }
      return res.status(400).json({
        message: error.message || "Failed to create teacher",
      });
    }
  },
);

// Get all teachers
router.get(
  "/teachers",
  withPermission(Permission.GET_TEACHERS),
  async (req, res) => {
    try {
      const currentUser = req.context.user;
      const pageNumber = parseInt(req.query.pageNumber ?? req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize ?? req.query.limit) || 15;

      const { academicYear } = req.query;
      const teacherRole = await roleService.getRoleByName(RoleName.TEACHER);

      const where = {
        schoolId: currentUser.schoolId,
        roleId: teacherRole.id,
        deletedAt: null,
        deletedBy: null,
      };

      // Apply academic year filter if provided
      if (academicYear && typeof academicYear === "string") {
        const parts = academicYear.split("-");
        if (parts.length === 2) {
          const startYear = parseInt(parts[0], 10);
          const endYearShort = parseInt(parts[1], 10);
          const endYear = endYearShort < 100 ? 2000 + endYearShort : endYearShort;
          if (!isNaN(startYear) && !isNaN(endYear)) {
            where.createdAt = {
              gte: new Date(`${startYear}-04-01T00:00:00.000Z`),
              lte: new Date(`${endYear}-03-31T23:59:59.999Z`),
            };
          }
        }
      }

      const teachers = await prisma.user.findMany({
        where,
        select: userService.getTeacherSelect(),
        ...paginateUtil.getPaginationParams(req),
        orderBy: { createdAt: "desc" },
      });

      const totalCount = await prisma.user.count({ where });

      // Attach file URLs
      const teachersWithUrls = await userService.attachFileURLs(teachers);

      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNext = pageNumber < totalPages;

      return res.json({
        message: "Teachers fetched!",
        data: teachersWithUrls,
        totalPages,
        hasNext,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to fetch teachers",
      });
    }
  },
);

// Get teacher by ID
router.get(
  "/teachers/:id",
  withPermission(Permission.GET_TEACHERS),
  async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.context.user;

      const teacherRole = await roleService.getRoleByName(RoleName.TEACHER);

      const teacher = await prisma.user.findFirst({
        where: {
          id,
          schoolId: currentUser.schoolId,
          roleId: teacherRole.id,
          deletedAt: null,
          deletedBy: null,
        },
        select: userService.getTeacherSelect(),
      });

      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found!" });
      }

      // Attach file URLs
      const teachersWithUrls = await userService.attachFileURLs([teacher]);

      return res.json({
        message: "Teacher fetched!",
        data: teachersWithUrls[0],
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to fetch teacher",
      });
    }
  },
);

// Update teacher
router.patch(
  "/teachers/:id",
  withPermission(Permission.EDIT_TEACHER),
  async (req, res) => {
    try {
      const { id } = req.params;
      const request = req.body.request || {};
      const currentUser = req.context.user;

      const teacherRole = await roleService.getRoleByName(RoleName.TEACHER);

      // Check if teacher exists
      const existingTeacher = await prisma.user.findFirst({
        where: {
          id,
          schoolId: currentUser.schoolId,
          roleId: teacherRole.id,
          deletedAt: null,
          deletedBy: null,
        },
      });

      if (!existingTeacher) {
        return res.status(404).json({ message: "Teacher not found!" });
      }

      // Build update data
      const userUpdateData = {
        updatedBy: currentUser.id,
      };

      if (request.firstName !== undefined)
        userUpdateData.firstName = request.firstName.trim();
      if (request.lastName !== undefined)
        userUpdateData.lastName = request.lastName.trim();
      if (request.email !== undefined)
        userUpdateData.email = request.email.trim();
      if (request.contact !== undefined)
        userUpdateData.contact = request.contact.trim();
      if (request.gender !== undefined) userUpdateData.gender = request.gender;
      if (request.dateOfBirth !== undefined)
        userUpdateData.dateOfBirth = new Date(request.dateOfBirth);
      if (request.address !== undefined) userUpdateData.address = request.address;
      if (request.aadhaarId !== undefined)
        userUpdateData.aadhaarId = request.aadhaarId?.trim() || null;
      if (request.registrationPhotoId !== undefined)
        userUpdateData.registrationPhotoId = request.registrationPhotoId || null;
      if (request.idPhotoId !== undefined)
        userUpdateData.idPhotoId = request.idPhotoId || null;

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: userUpdateData,
        select: userService.getTeacherSelect(),
      });

      // Update teacher profile
      const profileUpdateData = {};
      if (request.designation !== undefined)
        profileUpdateData.designation = request.designation?.trim() || null;
      if (request.highestQualification !== undefined)
        profileUpdateData.highestQualification =
          request.highestQualification?.trim() || null;
      if (request.university !== undefined)
        profileUpdateData.university = request.university?.trim() || null;
      if (request.yearOfPassing !== undefined)
        profileUpdateData.yearOfPassing = request.yearOfPassing || null;
      if (request.grade !== undefined)
        profileUpdateData.grade = request.grade?.trim() || null;
      if (request.transportId !== undefined)
        profileUpdateData.transportId = request.transportId || null;
      if (request.panCardNumber !== undefined)
        profileUpdateData.panCardNumber = request.panCardNumber?.trim() || null;
      if (request.bloodGroup !== undefined)
        profileUpdateData.bloodGroup = request.bloodGroup || null;
      if (request.basicSalary !== undefined)
        profileUpdateData.basicSalary = request.basicSalary !== "" && request.basicSalary !== null ? Number(request.basicSalary) : null;

      if (Object.keys(profileUpdateData).length > 0) {
        await prisma.teacherProfile.update({
          where: { userId: id },
          data: profileUpdateData,
        });
      }

      // Attach file URLs
      const usersWithUrls = await userService.attachFileURLs([updatedUser]);

      return res.json({
        message: "Teacher updated!",
        data: usersWithUrls[0],
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "Email already exists!",
        });
      }
      return res.status(400).json({
        message: error.message || "Failed to update teacher",
      });
    }
  },
);

// Delete teacher
router.delete(
  "/teachers/:id",
  withPermission(Permission.DELETE_TEACHER),
  async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.context.user;

      const teacherRole = await roleService.getRoleByName(RoleName.TEACHER);

      const existingTeacher = await prisma.user.findFirst({
        where: {
          id,
          schoolId: currentUser.schoolId,
          roleId: teacherRole.id,
          deletedAt: null,
          deletedBy: null,
        },
      });

      if (!existingTeacher) {
        return res.status(404).json({ message: "Teacher not found!" });
      }

      await prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: currentUser.id,
        },
      });

      return res.json({ message: "Teacher deleted!" });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to delete teacher",
      });
    }
  },
);

// ============================================
// STAFF ENDPOINTS
// ============================================

// Create staff
router.post(
  "/staff",
  withPermission(Permission.CREATE_STAFF),
  async (req, res) => {
    try {
      const request = req.body.request;
      const currentUser = req.context.user;

      // Validate school exists
      const school = await prisma.school.findUnique({
        where: { id: currentUser.schoolId },
      });

      if (!school) {
        return res.status(404).json({ message: "School not found!" });
      }

      // Get staff role
      const staffRole = await roleService.getRoleByName(RoleName.STAFF);

      // Generate password
      const generatedPassword = stringUtil.generateRandomString(15);

      // Generate public user ID (format: SCHOOLCODE + AT + 4 digits)
      // AT for Admin/Staff Type
      const existingStaff = await prisma.user.count({
        where: {
          schoolId: currentUser.schoolId,
          roleId: staffRole.id,
        },
      });
      const publicUserId = `${school.code}AT${String(existingStaff + 1).padStart(4, "0")}`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: request.email.trim(),
          password: await bcryptjs.hash(generatedPassword, 10),
          firstName: request.firstName.trim(),
          lastName: request.lastName?.trim() || "",
          contact: request.contact.trim(),
          gender: request.gender,
          dateOfBirth: new Date(request.dateOfBirth),
          address: request.address || [],
          aadhaarId: request.aadhaarId?.trim() || null,
          userType: UserType.SCHOOL,
          roleId: staffRole.id,
          schoolId: currentUser.schoolId,
          publicUserId,
          registrationPhotoId: request.registrationPhotoId || null,
          idPhotoId: request.idPhotoId || null,
          createdBy: currentUser.id,
        },
        select: userService.getStaffSelect(),
      });

      // Create staff profile
      await prisma.staffProfile.create({
        data: {
          userId: user.id,
          designation: request.designation?.trim() || null,
          basicSalary: request.basicSalary !== undefined && request.basicSalary !== "" ? Number(request.basicSalary) : null,
          createdBy: currentUser.id,
        },
      });

      // Attach file URLs
      const usersWithUrls = await userService.attachFileURLs([user]);

      return res.status(201).json({
        message: "Staff member created!",
        data: { ...usersWithUrls[0], password: generatedPassword },
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "Email already exists!",
        });
      }
      return res.status(400).json({
        message: error.message || "Failed to create staff member",
      });
    }
  },
);

// Get all staff
router.get(
  "/staff",
  withPermission(Permission.GET_STAFF),
  async (req, res) => {
    try {
      const currentUser = req.context.user;
      const pageNumber = parseInt(req.query.pageNumber) || 1;
      const pageSize = parseInt(req.query.pageSize) || 15;

      const { academicYear } = req.query;
      const staffRole = await roleService.getRoleByName(RoleName.STAFF);

      const where = {
        schoolId: currentUser.schoolId,
        roleId: staffRole.id,
        deletedAt: null,
        deletedBy: null,
      };

      // Apply academic year filter if provided
      if (academicYear && typeof academicYear === "string") {
        const parts = academicYear.split("-");
        if (parts.length === 2) {
          const startYear = parseInt(parts[0], 10);
          const endYearShort = parseInt(parts[1], 10);
          const endYear = endYearShort < 100 ? 2000 + endYearShort : endYearShort;
          if (!isNaN(startYear) && !isNaN(endYear)) {
            where.createdAt = {
              gte: new Date(`${startYear}-04-01T00:00:00.000Z`),
              lte: new Date(`${endYear}-03-31T23:59:59.999Z`),
            };
          }
        }
      }

      const staff = await prisma.user.findMany({
        where,
        select: userService.getStaffSelect(),
        ...paginateUtil.getPaginationParams(req),
        orderBy: { createdAt: "desc" },
      });

      const totalCount = await prisma.user.count({ where });

      // Attach file URLs
      const staffWithUrls = await userService.attachFileURLs(staff);

      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNext = pageNumber < totalPages;

      return res.json({
        message: "Staff members fetched!",
        data: staffWithUrls,
        totalPages,
        hasNext,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to fetch staff members",
      });
    }
  },
);

// Get staff by ID
router.get(
  "/staff/:id",
  withPermission(Permission.GET_STAFF),
  async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.context.user;

      const staffRole = await roleService.getRoleByName(RoleName.STAFF);

      const staffMember = await prisma.user.findFirst({
        where: {
          id,
          schoolId: currentUser.schoolId,
          roleId: staffRole.id,
          deletedAt: null,
          deletedBy: null,
        },
        select: userService.getStaffSelect(),
      });

      if (!staffMember) {
        return res.status(404).json({ message: "Staff member not found!" });
      }

      // Attach file URLs
      const usersWithUrls = await userService.attachFileURLs([staffMember]);

      return res.json({
        message: "Staff member fetched!",
        data: usersWithUrls[0],
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to fetch staff member",
      });
    }
  },
);

// Update staff
router.patch(
  "/staff/:id",
  withPermission(Permission.EDIT_STAFF),
  async (req, res) => {
    try {
      const { id } = req.params;
      const request = req.body.request || {};
      const currentUser = req.context.user;

      const staffRole = await roleService.getRoleByName(RoleName.STAFF);

      // Check if staff member exists
      const existingStaff = await prisma.user.findFirst({
        where: {
          id,
          schoolId: currentUser.schoolId,
          roleId: staffRole.id,
          deletedAt: null,
          deletedBy: null,
        },
      });

      if (!existingStaff) {
        return res.status(404).json({ message: "Staff member not found!" });
      }

      // Build update data
      const userUpdateData = {
        updatedBy: currentUser.id,
      };

      if (request.firstName !== undefined)
        userUpdateData.firstName = request.firstName.trim();
      if (request.lastName !== undefined)
        userUpdateData.lastName = request.lastName.trim();
      if (request.email !== undefined)
        userUpdateData.email = request.email.trim();
      if (request.contact !== undefined)
        userUpdateData.contact = request.contact.trim();
      if (request.gender !== undefined) userUpdateData.gender = request.gender;
      if (request.dateOfBirth !== undefined)
        userUpdateData.dateOfBirth = new Date(request.dateOfBirth);
      if (request.address !== undefined) userUpdateData.address = request.address;
      if (request.aadhaarId !== undefined)
        userUpdateData.aadhaarId = request.aadhaarId?.trim() || null;
      if (request.registrationPhotoId !== undefined)
        userUpdateData.registrationPhotoId = request.registrationPhotoId || null;
      if (request.idPhotoId !== undefined)
        userUpdateData.idPhotoId = request.idPhotoId || null;

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: userUpdateData,
        select: userService.getStaffSelect(),
      });

      // Update staff profile
      const profileUpdateData = {};
      if (request.designation !== undefined)
        profileUpdateData.designation = request.designation?.trim() || null;
      if (request.basicSalary !== undefined)
        profileUpdateData.basicSalary = request.basicSalary !== "" && request.basicSalary !== null ? Number(request.basicSalary) : null;

      if (Object.keys(profileUpdateData).length > 0) {
        await prisma.staffProfile.upsert({
          where: { userId: id },
          update: profileUpdateData,
          create: {
            userId: id,
            ...profileUpdateData,
            createdBy: currentUser.id
          }
        });
      }

      // Attach file URLs
      const usersWithUrls = await userService.attachFileURLs([updatedUser]);

      return res.json({
        message: "Staff member updated!",
        data: usersWithUrls[0],
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "Email already exists!",
        });
      }
      return res.status(400).json({
        message: error.message || "Failed to update staff member",
      });
    }
  },
);

// Delete staff
router.delete(
  "/staff/:id",
  withPermission(Permission.DELETE_STAFF),
  async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.context.user;

      const staffRole = await roleService.getRoleByName(RoleName.STAFF);

      const existingStaff = await prisma.user.findFirst({
        where: {
          id,
          schoolId: currentUser.schoolId,
          roleId: staffRole.id,
          deletedAt: null,
          deletedBy: null,
        },
      });

      if (!existingStaff) {
        return res.status(404).json({ message: "Staff member not found!" });
      }

      await prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: currentUser.id,
        },
      });

      return res.json({ message: "Staff member deleted!" });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to delete staff member",
      });
    }
  },
);

// ============================================
// STUDENT ENDPOINTS
// ============================================

// Create student
router.post(
  "/students",
  withPermission(Permission.CREATE_STUDENT),
  async (req, res) => {
    try {
      const request = req.body.request;
      const currentUser = req.context.user;

      // Validate school exists
      const school = await prisma.school.findUnique({
        where: { id: currentUser.schoolId },
      });

      if (!school) {
        return res.status(404).json({ message: "School not found!" });
      }

      // Validate class exists
      if (request.classId) {
        const classEntity = await prisma.class.findFirst({
          where: {
            id: request.classId,
            schoolId: currentUser.schoolId,
            deletedAt: null,
            deletedBy: null,
          },
        });

        if (!classEntity) {
          return res.status(404).json({ message: "Class not found!" });
        }
      }

      // Validate transport exists if provided
      if (request.transportId) {
        const transport = await prisma.transport.findFirst({
          where: {
            id: request.transportId,
            schoolId: currentUser.schoolId,
            deletedAt: null,
            deletedBy: null,
          },
        });

        if (!transport) {
          return res.status(404).json({ message: "Transport not found!" });
        }
      }

      // Get student role
      const studentRole = await roleService.getRoleByName(RoleName.STUDENT);

      // Generate password
      const generatedPassword = stringUtil.generateRandomString(15);

      // Generate public user ID (format: SCHOOLCODE + S + 4 digits)
      const existingStudents = await prisma.user.count({
        where: {
          schoolId: currentUser.schoolId,
          roleId: studentRole.id,
        },
      });
      const publicUserId = `${school.code}S${String(existingStudents + 1).padStart(4, "0")}`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: request.email.trim(),
          password: await bcryptjs.hash(generatedPassword, 10),
          firstName: request.firstName.trim(),
          lastName: request.lastName?.trim() || "",
          contact: request.contact.trim(),
          gender: request.gender,
          dateOfBirth: new Date(request.dateOfBirth),
          address: request.address || [],
          aadhaarId: request.aadhaarId?.trim() || null,
          userType: UserType.SCHOOL,
          roleId: studentRole.id,
          schoolId: currentUser.schoolId,
          publicUserId,
          registrationPhotoId: request.registrationPhotoId || null,
          idPhotoId: request.idPhotoId || null,
          createdBy: currentUser.id,
        },
        select: userService.getStudentSelect(),
      });

      // Create student profile
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          rollNumber: request.rollNumber ? parseInt(request.rollNumber) : 0,
          apaarId: request.apaarId?.trim() || null,
          classId: request.classId,
          transportId: request.transportId || null,
          fatherName: request.fatherName?.trim() || "",
          motherName: request.motherName?.trim() || "",
          fatherContact: request.fatherContact?.trim() || "",
          motherContact: request.motherContact?.trim() || "",
          fatherOccupation: request.fatherOccupation?.trim() || null,
          annualIncome: request.annualIncome ? parseFloat(request.annualIncome) : null,
          accommodationType: request.accommodationType || "DAY_SCHOLAR",
          bloodGroup: request.bloodGroup || null,
          createdBy: currentUser.id,
        },
      });

      // Attach file URLs
      const usersWithUrls = await userService.attachFileURLs([user]);

      return res.status(201).json({
        message: "Student created!",
        data: { ...usersWithUrls[0], password: generatedPassword },
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "Email or Aadhaar ID already exists!",
        });
      }
      return res.status(400).json({
        message: error.message || "Failed to create student",
      });
    }
  },
);

// Get all students
router.get(
  "/students",
  withPermission(Permission.GET_STUDENTS),
  async (req, res) => {
    try {
      const currentUser = req.context.user;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;

      const { academicYear } = req.query;
      const studentRole = await roleService.getRoleByName(RoleName.STUDENT);

      const where = {
        schoolId: currentUser.schoolId,
        roleId: studentRole.id,
        deletedAt: null,
        deletedBy: null,
      };

      const { classId, gender } = req.query;

      if (classId && typeof classId === "string") {
        where.studentProfile = { classId };
      }

      if (gender && typeof gender === "string" && ["MALE", "FEMALE"].includes(gender.toUpperCase())) {
        where.gender = gender.toUpperCase();
      }

      // Apply academic year filter if provided
      if (academicYear && typeof academicYear === "string") {
        const parts = academicYear.split("-");
        if (parts.length === 2) {
          const startYear = parseInt(parts[0], 10);
          const endYearShort = parseInt(parts[1], 10);
          const endYear = endYearShort < 100 ? 2000 + endYearShort : endYearShort;
          if (!isNaN(startYear) && !isNaN(endYear)) {
            where.createdAt = {
              gte: new Date(`${startYear}-04-01T00:00:00.000Z`),
              lte: new Date(`${endYear}-03-31T23:59:59.999Z`),
            };
          }
        }
      }

      const students = await prisma.user.findMany({
        where,
        select: userService.getStudentSelect(),
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { studentProfile: { class: { grade: "asc" } } },
          { studentProfile: { class: { division: "asc" } } },
          { studentProfile: { rollNumber: "asc" } },
          { firstName: "asc" },
        ],
      });

      const totalCount = await prisma.user.count({ where });

      // Attach file URLs
      const studentsWithUrls = await userService.attachFileURLs(students);

      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;

      return res.json({
        message: "Students fetched!",
        data: studentsWithUrls,
        totalPages,
        hasNext,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to fetch students",
      });
    }
  },
);

// Get student by ID
router.get(
  "/students/:id",
  withPermission(Permission.GET_STUDENTS),
  async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.context.user;

      const studentRole = await roleService.getRoleByName(RoleName.STUDENT);

      const student = await prisma.user.findFirst({
        where: {
          id,
          schoolId: currentUser.schoolId,
          roleId: studentRole.id,
          deletedAt: null,
          deletedBy: null,
        },
        select: userService.getStudentSelect(),
      });

      if (!student) {
        return res.status(404).json({ message: "Student not found!" });
      }

      // Attach file URLs
      const studentsWithUrls = await userService.attachFileURLs([student]);

      return res.json({
        message: "Student fetched!",
        data: studentsWithUrls[0],
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to fetch student",
      });
    }
  },
);

// Update student
router.patch(
  "/students/:id",
  withPermission(Permission.EDIT_STUDENT),
  async (req, res) => {
    try {
      const { id } = req.params;
      const request = req.body.request || {};
      const currentUser = req.context.user;

      const studentRole = await roleService.getRoleByName(RoleName.STUDENT);

      // Check if student exists
      const existingStudent = await prisma.user.findFirst({
        where: {
          id,
          schoolId: currentUser.schoolId,
          roleId: studentRole.id,
          deletedAt: null,
          deletedBy: null,
        },
        include: {
          studentProfile: true,
        },
      });

      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found!" });
      }

      // Validate class exists if provided
      if (request.classId && request.classId !== existingStudent.studentProfile?.classId) {
        const classEntity = await prisma.class.findFirst({
          where: {
            id: request.classId,
            schoolId: currentUser.schoolId,
            deletedAt: null,
            deletedBy: null,
          },
        });

        if (!classEntity) {
          return res.status(404).json({ message: "Class not found!" });
        }
      }

      // Validate transport exists if provided
      if (request.transportId && request.transportId !== existingStudent.studentProfile?.transportId) {
        const transport = await prisma.transport.findFirst({
          where: {
            id: request.transportId,
            schoolId: currentUser.schoolId,
            deletedAt: null,
            deletedBy: null,
          },
        });

        if (!transport) {
          return res.status(404).json({ message: "Transport not found!" });
        }
      }

      // Build update data
      const userUpdateData = {
        updatedBy: currentUser.id,
      };

      if (request.firstName !== undefined)
        userUpdateData.firstName = request.firstName.trim();
      if (request.lastName !== undefined)
        userUpdateData.lastName = request.lastName?.trim() || null;
      if (request.email !== undefined)
        userUpdateData.email = request.email.trim();
      if (request.contact !== undefined)
        userUpdateData.contact = request.contact.trim();
      if (request.gender !== undefined) userUpdateData.gender = request.gender;
      if (request.dateOfBirth !== undefined)
        userUpdateData.dateOfBirth = new Date(request.dateOfBirth);
      if (request.address !== undefined) userUpdateData.address = request.address;
      if (request.aadhaarId !== undefined)
        userUpdateData.aadhaarId = request.aadhaarId?.trim() || null;
      if (request.registrationPhotoId !== undefined)
        userUpdateData.registrationPhotoId = request.registrationPhotoId || null;
      if (request.idPhotoId !== undefined)
        userUpdateData.idPhotoId = request.idPhotoId || null;

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: userUpdateData,
        select: userService.getStudentSelect(),
      });

      // Update student profile
      const profileUpdateData = {};
      if (request.rollNumber !== undefined)
        profileUpdateData.rollNumber = request.rollNumber || 0;
      if (request.apaarId !== undefined)
        profileUpdateData.apaarId = request.apaarId?.trim() || null;
      if (request.classId !== undefined)
        profileUpdateData.classId = request.classId;
      if (request.transportId !== undefined)
        profileUpdateData.transportId = request.transportId || null;
      if (request.fatherName !== undefined)
        profileUpdateData.fatherName = request.fatherName?.trim() || "";
      if (request.motherName !== undefined)
        profileUpdateData.motherName = request.motherName?.trim() || "";
      if (request.fatherContact !== undefined)
        profileUpdateData.fatherContact = request.fatherContact?.trim() || "";
      if (request.motherContact !== undefined)
        profileUpdateData.motherContact = request.motherContact?.trim() || "";
      if (request.fatherOccupation !== undefined)
        profileUpdateData.fatherOccupation = request.fatherOccupation?.trim() || null;
      if (request.annualIncome !== undefined)
        profileUpdateData.annualIncome = request.annualIncome ? parseFloat(request.annualIncome) : null;
      if (request.accommodationType !== undefined)
        profileUpdateData.accommodationType = request.accommodationType;
      if (request.bloodGroup !== undefined)
        profileUpdateData.bloodGroup = request.bloodGroup || null;

      if (Object.keys(profileUpdateData).length > 0) {
        await prisma.studentProfile.update({
          where: { userId: id },
          data: profileUpdateData,
        });
      }

      // Attach file URLs
      const usersWithUrls = await userService.attachFileURLs([updatedUser]);

      return res.json({
        message: "Student updated!",
        data: usersWithUrls[0],
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "Email or Aadhaar ID already exists!",
        });
      }
      return res.status(400).json({
        message: error.message || "Failed to update student",
      });
    }
  },
);

// Delete student
router.delete(
  "/students/:id",
  withPermission(Permission.DELETE_STUDENT),
  async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.context.user;

      const studentRole = await roleService.getRoleByName(RoleName.STUDENT);

      const existingStudent = await prisma.user.findFirst({
        where: {
          id,
          schoolId: currentUser.schoolId,
          roleId: studentRole.id,
          deletedAt: null,
          deletedBy: null,
        },
      });

      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found!" });
      }

      await prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: currentUser.id,
        },
      });

      return res.json({ message: "Student deleted!" });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to delete student",
      });
    }
  },
);

// Bulk assign students to class
router.patch(
  "/students/bulk-assign-class",
  withPermission(Permission.EDIT_STUDENT),
  async (req, res) => {
    try {
      const { studentIds, classId } = req.body;
      const currentUser = req.context.user;

      if (!Array.isArray(studentIds) || !studentIds.length) {
        return res.status(400).json({ message: "Student IDs are required" });
      }

      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }

      // Validate class exists
      const classEntity = await prisma.class.findFirst({
        where: {
          id: classId,
          schoolId: currentUser.schoolId,
          deletedAt: null,
        },
      });

      if (!classEntity) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Update all students in a transaction
      await prisma.$transaction(
        studentIds.map((id) =>
          prisma.studentProfile.update({
            where: { userId: id },
            data: { classId },
          })
        )
      );

      return res.json({ message: "Students assigned to class successfully" });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to bulk assign students",
      });
    }
  }
);

// Bulk create teachers
router.post(
  "/teachers/bulk",
  withPermission(Permission.CREATE_TEACHER),
  async (req, res) => {
    try {
      const { csvData } = req.body;
      const currentUser = req.context.user;

      if (!csvData) {
        return res.status(400).json({ message: "CSV data is required" });
      }

      const school = await prisma.school.findUnique({
        where: { id: currentUser.schoolId },
      });

      const teacherRole = await roleService.getRoleByName(RoleName.TEACHER);
      const rows = csvUtil.parseCSV(csvData);

      if (rows.length === 0) {
        return res.status(400).json({ message: "No valid data found in CSV" });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [],
      };

      let currentTeacherCount = await prisma.user.count({
        where: {
          schoolId: currentUser.schoolId,
          roleId: teacherRole.id,
        },
      });

      for (const row of rows) {
        try {
          const publicUserId = `${school.code}T${String(++currentTeacherCount).padStart(4, "0")}`;
          const generatedPassword = stringUtil.generateRandomString(15);

          await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                email: row.email.toLowerCase(),
                password: await bcryptjs.hash(generatedPassword, 10),
                firstName: row.firstname,
                lastName: row.lastname || "",
                contact: row.contact,
                gender: row.gender?.toUpperCase() === "FEMALE" ? "FEMALE" : "MALE",
                dateOfBirth: new Date(row.dateofbirth),
                userType: UserType.SCHOOL,
                roleId: teacherRole.id,
                schoolId: currentUser.schoolId,
                publicUserId,
                createdBy: currentUser.id,
                aadhaarId: row.aadhaarid || null,
              },
            });

            await tx.teacherProfile.create({
              data: {
                userId: user.id,
                designation: row.designation || null,
                highestQualification: row.highestqualification || "",
                university: row.university || "",
                yearOfPassing: row.yearofpassing ? parseInt(row.yearofpassing) : 0,
                grade: row.grade || "",
                panCardNumber: row.pancardnumber || null,
                createdBy: currentUser.id,
              },
            });
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: row.email || row.firstname,
            error: error.message,
          });
          currentTeacherCount--; // Reset if failed
        }
      }

      return res.json({
        message: `Bulk upload completed: ${results.success} succeeded, ${results.failed} failed.`,
        data: results,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to bulk upload teachers",
      });
    }
  }
);

// Bulk create students
router.post(
  "/students/bulk",
  withPermission(Permission.CREATE_STUDENT),
  async (req, res) => {
    try {
      const { csvData } = req.body;
      const currentUser = req.context.user;

      if (!csvData) {
        return res.status(400).json({ message: "CSV data is required" });
      }

      const school = await prisma.school.findUnique({
        where: { id: currentUser.schoolId },
      });

      const studentRole = await roleService.getRoleByName(RoleName.STUDENT);
      const rows = csvUtil.parseCSV(csvData);

      if (rows.length === 0) {
        return res.status(400).json({ message: "No valid data found in CSV" });
      }

      // Pre-fetch classes for this school
      const classes = await prisma.class.findMany({
        where: { schoolId: currentUser.schoolId, deletedAt: null },
      });

      const results = {
        success: 0,
        failed: 0,
        errors: [],
      };

      let currentStudentCount = await prisma.user.count({
        where: {
          schoolId: currentUser.schoolId,
          roleId: studentRole.id,
        },
      });

      for (const row of rows) {
        try {
          // Resolve class (Format: "10 A" or "10-A")
          const classEntity = classes.find(c => {
            const className = `${c.grade} ${c.division}`.toLowerCase();
            const altName = `${c.grade}-${c.division}`.toLowerCase();
            const inputName = row.classname?.toLowerCase();
            return className === inputName || altName === inputName;
          });

          if (!classEntity) throw new Error(`Class ${row.classname} not found`);

          const publicUserId = `${school.code}S${String(++currentStudentCount).padStart(4, "0")}`;
          const generatedPassword = stringUtil.generateRandomString(15);

          await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                email: row.email.toLowerCase(),
                password: await bcryptjs.hash(generatedPassword, 10),
                firstName: row.firstname,
                lastName: row.lastname || "",
                contact: row.contact,
                gender: row.gender?.toUpperCase() === "FEMALE" ? "FEMALE" : "MALE",
                dateOfBirth: new Date(row.dateofbirth),
                userType: UserType.SCHOOL,
                roleId: studentRole.id,
                schoolId: currentUser.schoolId,
                publicUserId,
                createdBy: currentUser.id,
              },
            });

            await tx.studentProfile.create({
              data: {
                userId: user.id,
                rollNumber: row.rollnumber ? parseInt(row.rollnumber) : 0,
                apaarId: row.apaarid || null,
                classId: classEntity.id,
                fatherName: row.fathername || "",
                motherName: row.mothername || "",
                fatherContact: row.fathercontact || "",
                motherContact: row.mothercontact || "",
                createdBy: currentUser.id,
              },
            });
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: row.email || row.firstname,
            error: error.message,
          });
          currentStudentCount--;
        }
      }

      return res.json({
        message: `Bulk upload completed: ${results.success} succeeded, ${results.failed} failed.`,
        data: results,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to bulk upload students",
      });
    }
  }
);

// Export all students as CSV
router.get(
  "/students/export",
  withPermission(Permission.GET_STUDENTS),
  async (req, res) => {
    try {
      const currentUser = req.context.user;
      console.log(`Exporting students for school: ${currentUser.schoolId}`);

      const studentRole = await roleService.getRoleByName(RoleName.STUDENT);
      if (!studentRole) {
        console.error("Student role not found!");
        return res.status(404).json({ message: "Student role not found!" });
      }

      const students = await prisma.user.findMany({
        where: {
          schoolId: currentUser.schoolId,
          roleId: studentRole.id,
          deletedAt: null,
        },
        select: {
          publicUserId: true,
          firstName: true,
          lastName: true,
          email: true,
          contact: true,
          gender: true,
          dateOfBirth: true,
          aadhaarId: true,
          studentProfile: {
            select: {
              rollNumber: true,
              apaarId: true,
              fatherName: true,
              motherName: true,
              fatherContact: true,
              motherContact: true,
              bloodGroup: true,
              accommodationType: true,
              class: {
                select: { grade: true, division: true },
              },
            },
          },
        },
        orderBy: [
          { studentProfile: { class: { grade: "asc" } } },
          { studentProfile: { rollNumber: "asc" } },
        ],
      });

      const headers = [
        "Student ID", "Roll No", "First Name", "Last Name", "Email", "Contact",
        "Gender", "Date of Birth", "Class", "Division",
        "Father Name", "Father Contact", "Mother Name", "Mother Contact",
        "Aadhaar", "Apaar ID", "Blood Group", "Accommodation"
      ];

      const rows = students.map((s) => [
        s.publicUserId || "",
        s.studentProfile?.rollNumber || "",
        s.firstName,
        s.lastName || "",
        s.email,
        s.contact || "",
        s.gender || "",
        s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString("en-IN") : "",
        s.studentProfile?.class?.grade || "",
        s.studentProfile?.class?.division || "",
        s.studentProfile?.fatherName || "",
        s.studentProfile?.fatherContact || "",
        s.studentProfile?.motherName || "",
        s.studentProfile?.motherContact || "",
        s.aadhaarId || "",
        s.studentProfile?.apaarId || "",
        s.studentProfile?.bloodGroup || "",
        s.studentProfile?.accommodationType || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=all_students.csv");
      return res.send(csvContent);
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to export students",
      });
    }
  }
);

// Export all teachers as CSV
router.get(
  "/teachers/export",
  withPermission(Permission.GET_TEACHERS),
  async (req, res) => {
    try {
      const currentUser = req.context.user;
      console.log(`Exporting teachers for school: ${currentUser.schoolId}`);

      const teacherRole = await roleService.getRoleByName(RoleName.TEACHER);
      if (!teacherRole) {
        console.error("Teacher role not found!");
        return res.status(404).json({ message: "Teacher role not found!" });
      }

      const teachers = await prisma.user.findMany({
        where: {
          schoolId: currentUser.schoolId,
          roleId: teacherRole.id,
          deletedAt: null,
        },
        select: {
          publicUserId: true,
          firstName: true,
          lastName: true,
          email: true,
          contact: true,
          gender: true,
          dateOfBirth: true,
          aadhaarId: true,
          teacherProfile: {
            select: {
              designation: true,
              highestQualification: true,
              university: true,
              panCardNumber: true,
              bloodGroup: true,
              basicSalary: true,
            },
          },
        },
        orderBy: { firstName: "asc" },
      });

      const headers = [
        "Teacher ID", "First Name", "Last Name", "Email", "Contact",
        "Gender", "Date of Birth", "Designation", "Qualification",
        "University", "Aadhaar", "PAN", "Blood Group", "Basic Salary"
      ];

      const rows = teachers.map((t) => [
        t.publicUserId || "",
        t.firstName,
        t.lastName || "",
        t.email,
        t.contact || "",
        t.gender || "",
        t.dateOfBirth ? new Date(t.dateOfBirth).toLocaleDateString("en-IN") : "",
        t.teacherProfile?.designation || "",
        t.teacherProfile?.highestQualification || "",
        t.teacherProfile?.university || "",
        t.aadhaarId || "",
        t.teacherProfile?.panCardNumber || "",
        t.teacherProfile?.bloodGroup || "",
        t.teacherProfile?.basicSalary != null ? String(t.teacherProfile.basicSalary) : "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=all_teachers.csv");
      return res.send(csvContent);
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to export teachers",
      });
    }
  }
);

// Create employee
router.post(
  "/employees",
  withPermission(Permission.CREATE_EMPLOYEE),
  async (req, res) => {
    try {
      const request = req.body.request;
      const currentUser = req.context.user;
      const isSuperAdmin = currentUser.role?.name === RoleName.SUPER_ADMIN;

      const employeeRole = await roleService.getRoleByName(RoleName.EMPLOYEE);

      // Generate password
      const generatedPassword = stringUtil.generateRandomString(15);

      let publicUserId;
      let schoolIdToUse;
      let userTypeToUse;

      if (isSuperAdmin) {
        const existingEmployees = await prisma.user.count({
          where: {
            roleId: employeeRole.id,
            userType: UserType.APP,
            deletedAt: null,
          },
        });
        publicUserId = `EMP${String(existingEmployees + 1).padStart(4, "0")}`;
        schoolIdToUse = null;
        userTypeToUse = UserType.APP;
      } else {
        const school = await prisma.school.findUnique({
          where: { id: currentUser.schoolId },
        });
        if (!school) {
          return res.status(404).json({ message: "School not found!" });
        }
        const existingEmployees = await prisma.user.count({
          where: {
            schoolId: currentUser.schoolId,
            roleId: employeeRole.id,
          },
        });
        publicUserId = `${school.code}E${String(existingEmployees + 1).padStart(4, "0")}`;
        schoolIdToUse = currentUser.schoolId;
        userTypeToUse = UserType.SCHOOL;
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email: request.email.trim(),
          password: await bcryptjs.hash(generatedPassword, 10),
          firstName: request.firstName.trim(),
          lastName: request.lastName?.trim() || "",
          contact: request.contact.trim(),
          gender: request.gender,
          dateOfBirth: request.dateOfBirth ? new Date(request.dateOfBirth) : null,
          address: request.address || [],
          aadhaarId: request.aadhaarId?.trim() || null,
          userType: userTypeToUse,
          roleId: employeeRole.id,
          schoolId: schoolIdToUse,
          publicUserId,
          assignedRegionId: request.assignedRegionId || null,
          createdBy: currentUser.id,
        },
        include: {
          assignedRegion: {
            select: { id: true, name: true }
          }
        }
      });

      // Attach file URLs
      const usersWithUrls = await userService.attachFileURLs([user]);

      return res.status(201).json({
        message: "Employee created!",
        data: { ...usersWithUrls[0], password: generatedPassword },
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "Email or Aadhaar ID already exists!",
        });
      }
      return res.status(400).json({
        message: error.message || "Failed to create employee",
      });
    }
  },
);

// Get all employees
router.get(
  "/employees",
  withPermission(Permission.GET_EMPLOYEES),
  async (req, res) => {
    try {
      const currentUser = req.context.user;
      const { search } = req.query;
      const isSuperAdmin = currentUser.role?.name === RoleName.SUPER_ADMIN;

      const employeeRole = await roleService.getRoleByName(RoleName.EMPLOYEE);

      const where = {
        roleId: employeeRole.id,
        deletedAt: null,
        deletedBy: null,
      };

      if (isSuperAdmin) {
        where.userType = UserType.APP;
      } else {
        where.schoolId = currentUser.schoolId;
      }

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      const employees = await prisma.user.findMany({
        where,
        include: {
          assignedRegion: {
            select: { id: true, name: true }
          },
          assignedLocations: {
            where: { deletedAt: null }
          },
          assignedVendors: {
            where: { deletedAt: null }
          }
        },
        orderBy: { firstName: "asc" },
      });

      const employeesWithCounts = employees.map(emp => {
        const { assignedLocations, assignedVendors, ...rest } = emp;
        return {
          ...rest,
          totalLocations: assignedLocations.length,
          totalVendors: assignedVendors.length,
          status: "Active"
        };
      });

      // Attach file URLs
      const employeesWithUrls = await userService.attachFileURLs(employeesWithCounts);

      return res.json({
        message: "Employees fetched!",
        data: employeesWithUrls,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || "Failed to fetch employees",
      });
    }
  },
);

// Get employee by ID
router.get(
  "/employees/:id",
  withPermission(Permission.GET_EMPLOYEES),
  async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.context.user;
      const isSuperAdmin = currentUser.role?.name === RoleName.SUPER_ADMIN;

      const employeeRole = await roleService.getRoleByName(RoleName.EMPLOYEE);

      const employeeWhere = {
        id,
        roleId: employeeRole.id,
        deletedAt: null,
        deletedBy: null,
      };
      if (!isSuperAdmin) {
        employeeWhere.schoolId = currentUser.schoolId;
      } else {
        employeeWhere.userType = UserType.APP;
      }

      const employee = await prisma.user.findFirst({
        where: employeeWhere,
        include: {
          assignedRegion: {
            select: { id: true, name: true }
          },
          assignedLocations: {
            where: { deletedAt: null }
          },
          assignedVendors: {
            where: { deletedAt: null }
          }
        },
      });

      if (!employee) {
        return res.status(404).json({ message: "Employee not found!" });
      }

      const { assignedLocations, assignedVendors, ...rest } = employee;
      const employeeWithCounts = {
        ...rest,
        totalLocations: assignedLocations.length,
        totalVendors: assignedVendors.length,
        status: "Active"
      };

      // Attach file URLs
      const employeesWithUrls = await userService.attachFileURLs([employeeWithCounts]);

      return res.json({
        message: "Employee fetched!",
        data: employeesWithUrls[0],
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to fetch employee",
      });
    }
  },
);

// Update employee
router.patch(
  "/employees/:id",
  withPermission(Permission.EDIT_EMPLOYEE),
  async (req, res) => {
    try {
      const { id } = req.params;
      const request = req.body.request || {};
      const currentUser = req.context.user;

      const employeeRole = await roleService.getRoleByName(RoleName.EMPLOYEE);

      const patchEmployeeWhere = {
        id,
        roleId: employeeRole.id,
        deletedAt: null,
        deletedBy: null,
      };
      if (currentUser.role?.name === RoleName.SUPER_ADMIN) {
        patchEmployeeWhere.userType = UserType.APP;
      } else {
        patchEmployeeWhere.schoolId = currentUser.schoolId;
      }

      const existingEmployee = await prisma.user.findFirst({
        where: patchEmployeeWhere,
      });

      if (!existingEmployee) {
        return res.status(404).json({ message: "Employee not found!" });
      }

      // Build update data
      const userUpdateData = {
        updatedBy: currentUser.id,
      };

      if (request.firstName !== undefined)
        userUpdateData.firstName = request.firstName.trim();
      if (request.lastName !== undefined)
        userUpdateData.lastName = request.lastName?.trim() || null;
      if (request.email !== undefined)
        userUpdateData.email = request.email.trim();
      if (request.contact !== undefined)
        userUpdateData.contact = request.contact.trim();
      if (request.gender !== undefined) userUpdateData.gender = request.gender;
      if (request.dateOfBirth !== undefined)
        userUpdateData.dateOfBirth = request.dateOfBirth ? new Date(request.dateOfBirth) : null;
      if (request.address !== undefined) userUpdateData.address = request.address;
      if (request.aadhaarId !== undefined)
        userUpdateData.aadhaarId = request.aadhaarId?.trim() || null;
      if (request.assignedRegionId !== undefined)
        userUpdateData.assignedRegionId = request.assignedRegionId || null;

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: userUpdateData,
        include: {
          assignedRegion: {
            select: { id: true, name: true }
          }
        },
      });

      // Attach file URLs
      const usersWithUrls = await userService.attachFileURLs([updatedUser]);

      return res.json({
        message: "Employee updated!",
        data: usersWithUrls[0],
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "Email or Aadhaar ID already exists!",
        });
      }
      return res.status(400).json({
        message: error.message || "Failed to update employee",
      });
    }
  },
);

// Delete employee
router.delete(
  "/employees/:id",
  withPermission(Permission.DELETE_EMPLOYEE),
  async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.context.user;

      const employeeRole = await roleService.getRoleByName(RoleName.EMPLOYEE);

      const deleteEmployeeWhere = {
        id,
        roleId: employeeRole.id,
        deletedAt: null,
        deletedBy: null,
      };
      if (currentUser.role?.name === RoleName.SUPER_ADMIN) {
        deleteEmployeeWhere.userType = UserType.APP;
      } else {
        deleteEmployeeWhere.schoolId = currentUser.schoolId;
      }

      const existingEmployee = await prisma.user.findFirst({
        where: deleteEmployeeWhere,
      });

      if (!existingEmployee) {
        return res.status(404).json({ message: "Employee not found!" });
      }

      await prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: currentUser.id,
        },
      });

      return res.json({ message: "Employee deleted!" });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to delete employee",
      });
    }
  },
);

// Update employee permissions
router.patch(
  "/employees/:id/permissions",
  withPermission(Permission.EDIT_EMPLOYEE),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      const currentUser = req.context.user;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: "Permissions must be an array" });
      }

      const employeeRole = await roleService.getRoleByName(RoleName.EMPLOYEE);

      const permEmployeeWhere = {
        id,
        roleId: employeeRole.id,
        deletedAt: null,
        deletedBy: null,
      };
      if (currentUser.role?.name === RoleName.SUPER_ADMIN) {
        permEmployeeWhere.userType = UserType.APP;
      } else {
        permEmployeeWhere.schoolId = currentUser.schoolId;
      }

      const existingEmployee = await prisma.user.findFirst({
        where: permEmployeeWhere,
      });

      if (!existingEmployee) {
        return res.status(404).json({ message: "Employee not found!" });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          permissions,
          updatedBy: currentUser.id,
        },
        select: {
          id: true,
          permissions: true
        }
      });

      return res.json({
        message: "Employee permissions updated!",
        data: updatedUser,
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || "Failed to update employee permissions",
      });
    }
  }
);

export default router;


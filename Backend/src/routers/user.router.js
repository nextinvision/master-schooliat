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

      // Create user
      const user = await prisma.user.create({
        data: {
          email: request.email.trim(),
          password: await bcryptjs.hash(generatedPassword, 10),
          firstName: request.firstName.trim(),
          lastName: request.lastName.trim(),
          contact: request.contact.trim(),
          gender: request.gender,
          dateOfBirth: new Date(request.dateOfBirth),
          address: request.address || [],
          aadhaarId: request.aadhaarId?.trim() || null,
          userType: UserType.SCHOOL,
          roleId: teacherRole.id,
          schoolId: currentUser.schoolId,
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
          highestQualification: request.highestQualification?.trim() || null,
          university: request.university?.trim() || null,
          yearOfPassing: request.yearOfPassing || null,
          grade: request.grade?.trim() || null,
          transportId: request.transportId || null,
          panCardNumber: request.panCardNumber?.trim() || null,
          bloodGroup: request.bloodGroup || null,
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
      const pageNumber = parseInt(req.query.pageNumber) || 1;
      const pageSize = parseInt(req.query.pageSize) || 15;

      const teacherRole = await roleService.getRoleByName(RoleName.TEACHER);

      const where = {
        schoolId: currentUser.schoolId,
        roleId: teacherRole.id,
        deletedAt: null,
        deletedBy: null,
      };

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
          lastName: request.lastName?.trim() || null,
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
          rollNumber: request.rollNumber || 0,
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

      const studentRole = await roleService.getRoleByName(RoleName.STUDENT);

      const where = {
        schoolId: currentUser.schoolId,
        roleId: studentRole.id,
        deletedAt: null,
        deletedBy: null,
      };

      const students = await prisma.user.findMany({
        where,
        select: userService.getStudentSelect(),
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
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

export default router;


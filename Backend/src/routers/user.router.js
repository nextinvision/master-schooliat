import { Router } from "express";
import prisma from "../prisma/client.js";
import bcryptjs from "bcryptjs";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission, RoleName, UserType } from "../prisma/generated/index.js";
import roleService from "../services/role.service.js";
import paginateUtil from "../utils/paginate.util.js";
import userService from "../services/user.service.js";
import feeService from "../services/fee.service.js";
import validateRequest from "../middlewares/validate-request.middleware.js";
import createStudentSchema from "../schemas/user/create-student.schema.js";
import createTeacherSchema from "../schemas/user/create-teacher.schema.js";
import createEmployeeSchema from "../schemas/user/create-employee.schema.js";
import updateStudentSchema from "../schemas/user/update-student.schema.js";
import updateTeacherSchema from "../schemas/user/update-teacher.schema.js";
import updateEmployeeSchema from "../schemas/user/update-employee.schema.js";
import getStudentsSchema from "../schemas/user/get-students.schema.js";
import getTeachersSchema from "../schemas/user/get-teachers.schema.js";
import getEmployeesSchema from "../schemas/user/get-employees.schema.js";
import getRolesSchema from "../schemas/user/get-roles.schema.js";
import deleteStudentSchema from "../schemas/user/delete-student.schema.js";
import deleteTeacherSchema from "../schemas/user/delete-teacher.schema.js";
import deleteEmployeeSchema from "../schemas/user/delete-employee.schema.js";
import changePasswordSchema from "../schemas/user/change-password.schema.js";
import resetPasswordSchema from "../schemas/user/reset-password.schema.js";
import stringUtil from "../utils/string.util.js";
import logger from "../config/logger.js";

const router = Router();

router.post(
  "/students",
  withPermission(Permission.CREATE_STUDENT),
  validateRequest(createStudentSchema),
  async (req, res) => {
    const request = req.body.request;
    const currentUser = req.context.user;

    // Validate class exists
    await prisma.class.findUniqueOrThrow({
      where: {
        id: request.classId,
      },
    });

    // Validate transport exists if provided
    if (request.transportId != null) {
      await prisma.transport.findUniqueOrThrow({
        where: {
          id: request.transportId,
        },
      });
    }

    const role = await roleService.getRoleByName(RoleName.STUDENT);
    const school = await prisma.school.findUnique({
      where: { id: currentUser.schoolId },
    });

    const generatedPassword = stringUtil.generateRandomString(15);
    const newStudent = await prisma.user.create({
      data: {
        publicUserId: `${school.code}S${Math.floor(Math.random() * 9999) + 1}`,
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        contact: request.contact,
        gender: request.gender,
        dateOfBirth: new Date(request.dateOfBirth),
        address: request.address,
        aadhaarId: request.aadhaarId,
        userType: UserType.SCHOOL,
        roleId: role?.id,
        schoolId: currentUser.schoolId,
        createdBy: currentUser.id,
        registrationPhotoId: request.registrationPhotoId,
        idPhotoId: request.idPhotoId,
        password: await bcryptjs.hash(generatedPassword, 10),
        studentProfile: {
          create: {
            rollNumber: Math.floor(Math.random() * 100) + 1,
            apaarId: request.apaarId,
            fatherName: request.fatherName,
            motherName: request.motherName,
            fatherContact: request.fatherContact,
            motherContact: request.motherContact,
            fatherOccupation: request.fatherOccupation,
            annualIncome: request.annualIncome
              ? parseFloat(request.annualIncome)
              : null,
            accommodationType: request.accommodationType,
            bloodGroup: request.bloodGroup,
            class: {
              connect: { id: request.classId },
            },
            ...(request.transportId == null
              ? {}
              : {
                  transport: {
                    connect: { id: request.transportId },
                  },
                }),
            createdBy: currentUser.id,
          },
        },
      },
      select: userService.getStudentSelect(),
    });

    // Create fee installments for the student
    try {
      await feeService.createFeeInstallementsForStudent(
        newStudent.id,
        currentUser.schoolId,
        currentUser.id,
      );
    } catch (error) {
      logger.warn(
        `Failed to create fee installments for student ${newStudent.id}: ${error.message}`,
      );
    }

    return res.status(201).json({
      message: "Student created!",
      data: { ...newStudent, password: generatedPassword },
    });
  },
);

router.post(
  "/teachers",
  withPermission(Permission.CREATE_TEACHER),
  validateRequest(createTeacherSchema),
  async (req, res) => {
    const request = req.body.request;
    const currentUser = req.context.user;

    // Validate transport exists if provided
    if (request.transportId != null) {
      await prisma.transport.findUniqueOrThrow({
        where: {
          id: request.transportId,
        },
      });
    }

    const role = await roleService.getRoleByName(RoleName.TEACHER);
    const school = await prisma.school.findUnique({
      where: { id: currentUser.schoolId },
    });

    const generatedPassword = stringUtil.generateRandomString(15);
    const newTeacher = await prisma.user.create({
      data: {
        publicUserId: `${school.code}T${Math.floor(Math.random() * 9999) + 1}`,
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        contact: request.contact,
        gender: request.gender,
        dateOfBirth: new Date(request.dateOfBirth),
        address: request.address,
        aadhaarId: request.aadhaarId,
        userType: UserType.SCHOOL,
        roleId: role?.id,
        schoolId: currentUser.schoolId,
        createdBy: currentUser.id,
        registrationPhotoId: request.registrationPhotoId,
        idPhotoId: request.idPhotoId,
        password: await bcryptjs.hash(generatedPassword, 10),
        teacherProfile: {
          create: {
            designation: request.designation,
            highestQualification: request.highestQualification,
            university: request.university,
            yearOfPassing: parseInt(request.yearOfPassing),
            grade: request.grade,
            panCardNumber: request.panCardNumber,
            ...(request.bloodGroup ? { bloodGroup: request.bloodGroup } : {}),
            ...(request.transportId == null
              ? {}
              : {
                  transport: {
                    connect: { id: request.transportId },
                  },
                }),
            createdBy: currentUser.id,
          },
        },
      },
      select: userService.getTeacherSelect(),
    });

    return res.status(201).json({
      message: "Teacher created!",
      data: { ...newTeacher, password: generatedPassword },
    });
  },
);

router.get(
  "/employees/:id",
  withPermission(Permission.GET_EMPLOYEES),
  async (req, res) => {
    const { id } = req.params;
    let employee = await userService.getEmployeeById(id);

    [employee] = await userService.attachFileURLs([employee]);

    return res.json({
      message: "Employee fetched!",
      data: { ...employee, password: null },
    });
  },
);

router.post(
  "/employees",
  withPermission(Permission.CREATE_EMPLOYEE),
  validateRequest(createEmployeeSchema),
  async (req, res) => {
    const request = req.body.request;
    const currentUser = req.context.user;

    // Only validate region if provided
    if (request.assignedRegionId) {
      await prisma.region.findUniqueOrThrow({
        where: {
          id: request.assignedRegionId,
        },
      });
    }

    const role = await roleService.getRoleByName(RoleName.EMPLOYEE);

    const generatedPassword = stringUtil.generateRandomString(15);

    logger.info(
      `Creating employee user with credentials: ${JSON.stringify({
        email: request.email,
        password: generatedPassword,
      })}`,
    );

    const newEmployee = await prisma.user.create({
      data: {
        publicUserId: `APPE${Math.floor(Math.random() * 9999) + 1}`,
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        contact: request.contact,
        gender: request.gender,
        dateOfBirth: new Date(request.dateOfBirth),
        address: request.address,
        aadhaarId: request.aadhaarId,
        userType: UserType.APP, // Note: Employee is APP type, not SCHOOL
        roleId: role?.id,
        assignedRegionId: request.assignedRegionId || null,
        createdBy: currentUser.id,
        registrationPhotoId: request.registrationPhotoId,
        idPhotoId: request.idPhotoId,
        password: await bcryptjs.hash(generatedPassword, 10),
      },
      select: userService.getEmployeeSelect(),
    });

    // Include the plain text password in the response for display to the admin
    const employeeResponse = {
      ...newEmployee,
      password: generatedPassword,
    };

    logger.info(`Employee created successfully with ID: ${newEmployee.id}`);

    return res.status(201).json({
      message: "Employee created!",
      data: employeeResponse,
    });
  },
);

router.get(
  "/students",
  withPermission(Permission.GET_STUDENTS),
  validateRequest(getStudentsSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const schoolId = currentUser.schoolId;
    const role = await roleService.getRoleByName(RoleName.STUDENT);

    let users = await prisma.user.findMany({
      select: userService.getStudentSelect(),
      where: {
        roleId: role?.id,
        schoolId: schoolId || null,
        userType: UserType.SCHOOL,
        deletedAt: null,
        deletedBy: null,
      },
      ...paginateUtil.getPaginationParams(req),
    });

    users.forEach((user) => {
      user.attendance = {
        percentage: 0,
      };
      user.fees = "PAID";
    });

    users = await userService.attachFileURLs(users);

    return res.json({ message: "Students fetched!", data: users });
  },
);

router.get(
  "/teachers",
  withPermission(Permission.GET_TEACHERS),
  validateRequest(getTeachersSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const schoolId = currentUser.schoolId;
    const role = await roleService.getRoleByName(RoleName.TEACHER);

    let users = await prisma.user.findMany({
      select: userService.getTeacherSelect(),
      where: {
        roleId: role?.id,
        schoolId: schoolId || null,
        userType: UserType.SCHOOL,
        deletedAt: null,
        deletedBy: null,
      },
      ...paginateUtil.getPaginationParams(req),
    });

    users.forEach((user) => {
      user.attendance = {
        percentage: 0,
      };
      // current month's salary status
      user.salary = "PAID";
      // fetch a class with classTeacherId as current teacher, if not present, it can be null
      user.class = "Class";
      // fetch subjects from timetable
      user.subjects = "Maths, Science";
    });

    users = await userService.attachFileURLs(users);

    return res.json({ message: "Teachers fetched!", data: users });
  },
);

router.get(
  "/employees",
  withPermission(Permission.GET_EMPLOYEES),
  validateRequest(getEmployeesSchema),
  async (req, res) => {
    const { search } = req.query;
    const role = await roleService.getRoleByName(RoleName.EMPLOYEE);

    const where = {
      roleId: role?.id,
      userType: UserType.APP,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    let users = await prisma.user.findMany({
      select: userService.getEmployeeSelect(),
      where: {
        roleId: role?.id,
        userType: UserType.APP,
        deletedAt: null,
        deletedBy: null,
      },
      ...paginateUtil.getPaginationParams(req),
    });

    users = await userService.attachFileURLs(users);

    return res.json({ message: "Employees fetched!", data: users });
  },
);

router.get(
  "/roles",
  withPermission(Permission.GET_ROLES),
  validateRequest(getRolesSchema),
  async (req, res) => {
    const roles = await prisma.role.findMany();
    return res.json({ message: "Roles fetched!", data: roles });
  },
);

router.patch(
  "/students/:id",
  withPermission(Permission.EDIT_STUDENT),
  validateRequest(updateStudentSchema),
  async (req, res) => {
    const { id } = req.params;
    const updateData = req.body.request || {};
    const currentUser = req.context.user;

    // Check if user exists and is not deleted
    const existingUser = await prisma.user.findUnique({
      where: { id, deletedAt: null, deletedBy: null },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "Student not found!" });
    }

    if (updateData.classId != null) {
      const classEntity = await prisma.class.findFirst({
        where: {
          id: updateData.classId,
          deletedAt: null,
          deletedBy: null,
        },
      });
      if (!classEntity) {
        return res.status(404).json({ message: "Class not found or deleted!" });
      }
    }

    // Validate transport exists and is not deleted if provided
    if (updateData.transportId != null) {
      const transportEntity = await prisma.transport.findFirst({
        where: {
          id: updateData.transportId,
          deletedAt: null,
          deletedBy: null,
        },
      });
      if (!transportEntity) {
        return res
          .status(404)
          .json({ message: "Transport not found or deleted!" });
      }
    }

    // Build update data object with only provided fields
    const userUpdateData = {};
    const studentProfileUpdateData = {};

    if (updateData.firstName !== undefined)
      userUpdateData.firstName = updateData.firstName;
    if (updateData.lastName !== undefined)
      userUpdateData.lastName = updateData.lastName;
    if (updateData.email !== undefined) userUpdateData.email = updateData.email;
    if (updateData.contact !== undefined)
      userUpdateData.contact = updateData.contact;
    if (updateData.gender !== undefined)
      userUpdateData.gender = updateData.gender;
    if (updateData.dateOfBirth !== undefined)
      userUpdateData.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.address !== undefined)
      userUpdateData.address = updateData.address;
    if (updateData.aadhaarId !== undefined)
      userUpdateData.aadhaarId = updateData.aadhaarId;
    if (updateData.registrationPhotoId !== undefined)
      userUpdateData.registrationPhotoId = updateData.registrationPhotoId;
    if (updateData.idPhotoId !== undefined)
      userUpdateData.idPhotoId = updateData.idPhotoId;

    if (updateData.apaarId !== undefined)
      studentProfileUpdateData.apaarId = updateData.apaarId;
    if (updateData.classId !== undefined)
      studentProfileUpdateData.classId = updateData.classId;
    if (updateData.transportId !== undefined)
      studentProfileUpdateData.transportId = updateData.transportId;
    if (updateData.fatherName !== undefined)
      studentProfileUpdateData.fatherName = updateData.fatherName;
    if (updateData.motherName !== undefined)
      studentProfileUpdateData.motherName = updateData.motherName;
    if (updateData.fatherContact !== undefined)
      studentProfileUpdateData.fatherContact = updateData.fatherContact;
    if (updateData.motherContact !== undefined)
      studentProfileUpdateData.motherContact = updateData.motherContact;
    if (updateData.fatherOccupation !== undefined)
      studentProfileUpdateData.fatherOccupation = updateData.fatherOccupation;
    if (updateData.annualIncome !== undefined)
      studentProfileUpdateData.annualIncome = updateData.annualIncome
        ? parseFloat(updateData.annualIncome)
        : null;
    if (updateData.accommodationType !== undefined)
      studentProfileUpdateData.accommodationType = updateData.accommodationType;
    if (updateData.bloodGroup !== undefined)
      studentProfileUpdateData.bloodGroup = updateData.bloodGroup;

    userUpdateData.updatedBy = currentUser.id;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...userUpdateData,
        ...(Object.keys(studentProfileUpdateData).length > 0 && {
          studentProfile: {
            update: studentProfileUpdateData,
          },
        }),
      },
      select: userService.getStudentSelect(),
    });

    return res.json({ message: "Student updated!", data: updatedUser });
  },
);

router.patch(
  "/teachers/:id",
  withPermission(Permission.EDIT_TEACHER),
  validateRequest(updateTeacherSchema),
  async (req, res) => {
    const { id } = req.params;
    const updateData = req.body.request || {};
    const currentUser = req.context.user;

    // Check if user exists and is not deleted
    const existingUser = await prisma.user.findUnique({
      where: { id, deletedAt: null, deletedBy: null },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "Teacher not found!" });
    }

    // Validate transport exists and is not deleted if provided
    if (updateData.transportId != null) {
      const transportEntity = await prisma.transport.findFirst({
        where: {
          id: updateData.transportId,
          deletedAt: null,
          deletedBy: null,
        },
      });
      if (!transportEntity) {
        return res
          .status(404)
          .json({ message: "Transport not found or deleted!" });
      }
    }

    // Build update data object with only provided fields
    const userUpdateData = {};
    const teacherProfileUpdateData = {};

    if (updateData.firstName !== undefined)
      userUpdateData.firstName = updateData.firstName;
    if (updateData.lastName !== undefined)
      userUpdateData.lastName = updateData.lastName;
    if (updateData.email !== undefined) userUpdateData.email = updateData.email;
    if (updateData.contact !== undefined)
      userUpdateData.contact = updateData.contact;
    if (updateData.gender !== undefined)
      userUpdateData.gender = updateData.gender;
    if (updateData.dateOfBirth !== undefined)
      userUpdateData.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.address !== undefined)
      userUpdateData.address = updateData.address;
    if (updateData.aadhaarId !== undefined)
      userUpdateData.aadhaarId = updateData.aadhaarId;
    if (updateData.registrationPhotoId !== undefined)
      userUpdateData.registrationPhotoId = updateData.registrationPhotoId;
    if (updateData.idPhotoId !== undefined)
      userUpdateData.idPhotoId = updateData.idPhotoId;

    if (updateData.designation !== undefined)
      teacherProfileUpdateData.designation = updateData.designation;
    if (updateData.highestQualification !== undefined)
      teacherProfileUpdateData.highestQualification =
        updateData.highestQualification;
    if (updateData.university !== undefined)
      teacherProfileUpdateData.university = updateData.university;
    if (updateData.yearOfPassing !== undefined)
      teacherProfileUpdateData.yearOfPassing = parseInt(
        updateData.yearOfPassing,
      );
    if (updateData.grade !== undefined)
      teacherProfileUpdateData.grade = updateData.grade;
    if (updateData.transportId !== undefined)
      teacherProfileUpdateData.transportId = updateData.transportId;
    if (updateData.bloodGroup !== undefined)
      teacherProfileUpdateData.bloodGroup = updateData.bloodGroup;

    userUpdateData.updatedBy = currentUser.id;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...userUpdateData,
        ...(Object.keys(teacherProfileUpdateData).length > 0 && {
          teacherProfile: {
            update: teacherProfileUpdateData,
          },
        }),
      },
      select: userService.getTeacherSelect(),
    });

    return res.json({ message: "Teacher updated!", data: updatedUser });
  },
);

router.patch(
  "/employees/:id",
  withPermission(Permission.EDIT_EMPLOYEE),
  validateRequest(updateEmployeeSchema),
  async (req, res) => {
    const { id } = req.params;
    const updateData = req.body.request || {};
    const currentUser = req.context.user;

    // Check if user exists and is not deleted
    const existingUser = await prisma.user.findUnique({
      where: { id, deletedAt: null, deletedBy: null },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "Employee not found!" });
    }

    // Validate region exists and is not deleted if provided (and not null)
    if (updateData.assignedRegionId) {
      const regionEntity = await prisma.region.findFirst({
        where: {
          id: updateData.assignedRegionId,
          deletedAt: null,
          deletedBy: null,
        },
      });
      if (!regionEntity) {
        return res
          .status(404)
          .json({ message: "Region not found or deleted!" });
      }
    }

    // Build update data object with only provided fields
    const userUpdateData = {};

    if (updateData.firstName !== undefined)
      userUpdateData.firstName = updateData.firstName;
    if (updateData.lastName !== undefined)
      userUpdateData.lastName = updateData.lastName;
    if (updateData.email !== undefined) userUpdateData.email = updateData.email;
    if (updateData.contact !== undefined)
      userUpdateData.contact = updateData.contact;
    if (updateData.gender !== undefined)
      userUpdateData.gender = updateData.gender;
    if (updateData.dateOfBirth !== undefined)
      userUpdateData.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.address !== undefined)
      userUpdateData.address = updateData.address;
    if (updateData.aadhaarId !== undefined)
      userUpdateData.aadhaarId = updateData.aadhaarId;
    // Allow setting to null to remove the assigned region
    if (updateData.assignedRegionId !== undefined)
      userUpdateData.assignedRegionId = updateData.assignedRegionId;
    if (updateData.registrationPhotoId !== undefined)
      userUpdateData.registrationPhotoId = updateData.registrationPhotoId;
    if (updateData.idPhotoId !== undefined)
      userUpdateData.idPhotoId = updateData.idPhotoId;

    userUpdateData.updatedBy = currentUser.id;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: userUpdateData,
      select: userService.getEmployeeSelect(),
    });

    return res.json({ message: "Employee updated!", data: updatedUser });
  },
);

router.delete(
  "/students/:id",
  withPermission(Permission.DELETE_STUDENT),
  validateRequest(deleteStudentSchema),
  async (req, res) => {
    const { id } = req.params;
    const currentUser = req.context.user;

    const existingUser = await prisma.user.findUnique({
      where: { id, deletedAt: null, deletedBy: null },
    });

    if (!existingUser) {
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
  },
);

router.delete(
  "/teachers/:id",
  withPermission(Permission.DELETE_TEACHER),
  validateRequest(deleteTeacherSchema),
  async (req, res) => {
    const { id } = req.params;
    const currentUser = req.context.user;

    const existingUser = await prisma.user.findUnique({
      where: { id, deletedAt: null, deletedBy: null },
    });

    if (!existingUser) {
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
  },
);

router.delete(
  "/employees/:id",
  withPermission(Permission.DELETE_EMPLOYEE),
  validateRequest(deleteEmployeeSchema),
  async (req, res) => {
    const { id } = req.params;
    const currentUser = req.context.user;

    const existingUser = await prisma.user.findUnique({
      where: { id, deletedAt: null, deletedBy: null },
    });

    if (!existingUser) {
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
  },
);

router.post(
  "/change-password",
  validateRequest(changePasswordSchema),
  async (req, res) => {
    const request = req.body.request;
    const currentUser = req.context.user;

    // Get user with password field
    const existingUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, password: true },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    const passwordMatched = await bcryptjs.compare(
      request.currentPassword,
      existingUser.password,
    );

    if (!passwordMatched) {
      return res.status(400).json({
        message: "Incorrect current password",
      });
    }

    // Hash and update new password
    const hashedPassword = await bcryptjs.hash(request.newPassword, 10);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        password: hashedPassword,
      },
    });

    return res.json({ message: "Password changed successfully!" });
  },
);

router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  async (req, res) => {
    const request = req.body.request;
    const currentUser = req.context.user;

    const currentUserRole = await prisma.role.findUnique({
      where: { id: currentUser.roleId },
    });

    if (!currentUserRole) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Get target user with role
    const targetUser = await prisma.user.findUnique({
      where: { id: request.userId },
      include: {
        role: true,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Authorization logic
    const isSuperAdmin = currentUserRole.name === RoleName.SUPER_ADMIN;
    const isSchoolAdmin = currentUserRole.name === RoleName.SCHOOL_ADMIN;

    const targetIsEmployee = targetUser.role.name === RoleName.EMPLOYEE;
    const targetIsTeacher = targetUser.role.name === RoleName.TEACHER;
    const targetIsStudent = targetUser.role.name === RoleName.STUDENT;
    const targetIsStaff = targetUser.role.name === RoleName.STAFF;

    let hasPermission = false;

    if (isSuperAdmin && targetIsEmployee) {
      hasPermission = true;
    } else if (
      isSchoolAdmin &&
      (targetIsTeacher || targetIsStudent || targetIsStaff)
    ) {
      // Verify target user belongs to same school
      if (targetUser.schoolId !== currentUser.schoolId) {
        return res.status(403).json({
          message: "You can only reset passwords for users in your school!",
        });
      }
      hasPermission = true;
    }

    if (!hasPermission) {
      return res.status(403).json({
        message: "You do not have permission to reset this user's password!",
      });
    }

    // Hash and update password
    const hashedPassword = await bcryptjs.hash(request.newPassword, 10);

    await prisma.user.update({
      where: { id: request.userId },
      data: {
        password: hashedPassword,
      },
    });

    return res.json({ message: "Password reset successfully!" });
  },
);

export default router;

import { Router } from "express";
import prisma from "../prisma/client.js";
import withPermission from "../middlewares/with-permission.middleware.js";
import { Permission, RoleName, UserType } from "../prisma/generated/index.js";
import userService from "../services/user.service.js";
import { Prisma } from "../prisma/generated/index.js";
import validateRequest from "../middlewares/validate-request.middleware.js";
import paginateUtil from "../utils/paginate.util.js";
import idCardService from "../services/id-card.service.js";
import createSchoolSchema from "../schemas/school/create-school.schema.js";
import createClassesSchema from "../schemas/school/create-classes.schema.js";
import updateSchoolSchema from "../schemas/school/update-school.schema.js";
import updateClassSchema from "../schemas/school/update-class.schema.js";
import getSchoolsSchema from "../schemas/school/get-schools.schema.js";
import getMySchoolSchema from "../schemas/school/get-my-school.schema.js";
import getClassesSchema from "../schemas/school/get-classes.schema.js";
import deleteSchoolSchema from "../schemas/school/delete-school.schema.js";
import deleteClassSchema from "../schemas/school/delete-class.schema.js";

const router = Router();

router.post(
  "/",
  withPermission(Permission.CREATE_SCHOOL),
  validateRequest(createSchoolSchema),
  async (req, res) => {
    const request = req.body.request;
    const currentUser = req.context.user;

    const newSchool = await prisma.school.create({
      data: {
        name: request.name,
        email: request.email,
        phone: request.phone,
        address: request.address,
        code: request.code,
        gstNumber: request.gstNumber,
        principalName: request.principalName,
        principalEmail: request.principalEmail,
        principalPhone: request.principalPhone,
        establishedYear: request.establishedYear
          ? parseInt(request.establishedYear)
          : null,
        boardAffiliation: request.boardAffiliation,
        studentStrength: request.studentStrength
          ? parseInt(request.studentStrength)
          : null,
        certificateLink: request.certificateLink,
        createdBy: currentUser.id,
      },
    });

    // Create default settings for the school
    await prisma.settings.create({
      data: {
        schoolId: newSchool.id,
        studentFeeInstallments: 12,
        studentFeeAmount: 0,
        currentInstallmentNumber: 1,
        createdBy: currentUser.id,
      },
    });

    const schoolAdmin = await userService.createSchoolAdmin(
      newSchool,
      currentUser,
    );

    return res.status(201).json({
      message: "School created!",
      data: { ...newSchool, admin: schoolAdmin },
    });
  },
);

router.get(
  "/",
  withPermission(Permission.GET_SCHOOLS),
  validateRequest(getSchoolsSchema),
  async (req, res) => {
    const { search } = req.query;

    const where = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
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
      where: {
        deletedAt: null,
        deletedBy: null,
      },
    });

    const schoolIds = schools.map((school) => school.id);
    const schoolWithUserCounts = await prisma.user.groupBy({
      by: [Prisma.UserScalarFieldEnum.schoolId],
      where: {
        schoolId: {
          in: schoolIds,
        },
        deletedAt: null,
        deletedBy: null,
      },
      _count: {
        _all: true,
      },
    });

    const schoolCountMap = schoolWithUserCounts.reduce((acc, item) => {
      acc[item.schoolId] = item._count._all;
      return acc;
    }, {});

    schools.forEach((school) => {
      school.userCount = schoolCountMap[school.id];
    });

    return res.json({ message: "Schools fetched!", data: schools });
  },
);

router.get(
  "/my-school",
  withPermission(Permission.GET_MY_SCHOOL),
  validateRequest(getMySchoolSchema),
  async (req, res) => {
    const school = await prisma.school.findFirst({
      where: {
        id: currentUser.schoolId,
        deletedAt: null,
        deletedBy: null,
      },
      select: {
        id: true,
        name: true,
        address: true,
      },
    });

    return res.json({
      message: "School fetched!",
      data: { ...school },
    });
  },
);

router.post(
  "/classes",
  withPermission(Permission.CREATE_CLASSES),
  validateRequest(createClassesSchema),
  async (req, res) => {
    const request = req.body.request || [];
    const currentUser = req.context.user;
    const schoolId = currentUser.schoolId;

    // Validate unique grade+division combination within request
    const gradeDivisionMap = new Map();
    for (const cls of request) {
      const key = `${cls.grade}-${cls.division || ""}`;
      if (gradeDivisionMap.has(key)) {
        return res.status(400).json({
          message:
            "Invalid classes configuration. At least 1 combination of grade and division is repeated.",
        });
      }
      gradeDivisionMap.set(key, cls);
    }

    // Get all existing classes for this school (single query)
    const existingClassIds = request
      .map((cls) => cls.id)
      .filter((id) => id != null);

    const allExistingClasses = await prisma.class.findMany({
      where: {
        schoolId,
        deletedAt: null,
        deletedBy: null,
      },
      select: { id: true, grade: true, division: true },
    });

    // Check for duplicates with existing classes (excluding classes being updated)
    const existingIdsSet = new Set(existingClassIds);
    for (const existingClass of allExistingClasses) {
      if (existingIdsSet.has(existingClass.id)) continue; // Skip classes being updated
      const existingKey = `${existingClass.grade}-${existingClass.division || ""}`;
      if (gradeDivisionMap.has(existingKey)) {
        return res.status(400).json({
          message:
            "Invalid classes configuration. At least 1 combination of grade and division is repeated.",
        });
      }
    }

    // Separate classes into create and update
    const classesToCreate = request.filter((cls) => !cls.id);
    const classesToUpdate = request.filter((cls) => cls.id);

    // Find classes to delete (existing but not in request)
    const requestedIdsSet = new Set(classesToUpdate.map((cls) => cls.id));
    const classesToDeleteIds = allExistingClasses
      .map((cls) => cls.id)
      .filter((id) => !requestedIdsSet.has(id));

    // Validate class teachers exist if provided (single query)
    const classTeacherIds = request
      .map((cls) => cls.classTeacherId)
      .filter((id) => id != null);

    if (classTeacherIds.length > 0) {
      const teachers = await prisma.user.findMany({
        where: {
          id: { in: classTeacherIds },
          deletedAt: null,
          deletedBy: null,
        },
      });

      if (teachers.length !== classTeacherIds.length) {
        return res
          .status(404)
          .json({ message: "One or more teachers not found or deleted!" });
      }
    }

    // Use transaction to perform all operations (single transaction, no Promise.all)
    const result = await prisma.$transaction(async (tx) => {
      const allResults = [];

      // Delete classes not in request
      if (classesToDeleteIds.length > 0) {
        await tx.class.updateMany({
          where: {
            id: { in: classesToDeleteIds },
            schoolId,
          },
          data: {
            deletedAt: new Date(),
            deletedBy: currentUser.id,
          },
        });
      }

      // Create new classes
      let createdClassIds = [];
      if (classesToCreate.length > 0) {
        const createdClasses = await tx.class.createManyAndReturn({
          data: classesToCreate.map((cls) => ({
            grade: cls.grade,
            division: cls.division || null,
            classTeacherId: cls.classTeacherId || null,
            schoolId,
            createdBy: currentUser.id,
          })),
        });
        createdClassIds = createdClasses.map((c) => c.id);
        allResults.push(...createdClasses);
      }

      // Update existing classes sequentially (no Promise.all)
      for (const cls of classesToUpdate) {
        const updatedClass = await tx.class.update({
          where: { id: cls.id },
          data: {
            grade: cls.grade,
            division: cls.division || null,
            classTeacherId: cls.classTeacherId || null,
            updatedBy: currentUser.id,
          },
        });
        allResults.push(updatedClass);
      }

      // Initialize ID card collections for newly created classes
      if (createdClassIds.length > 0) {
        await idCardService.initializeIdCardCollectionsForNewClasses(
          tx,
          createdClassIds,
          schoolId,
          currentUser.id,
        );
      }

      return allResults;
    });

    return res.status(201).json({
      message: "Classes processed successfully!",
      data: result,
    });
  },
);

router.get(
  "/classes",
  withPermission(Permission.GET_CLASSES),
  validateRequest(getClassesSchema),
  async (req, res) => {
    const currentUser = req.context.user;
    const where = {
      schoolId: currentUser.schoolId,
      deletedAt: null,
      deletedBy: null,
    };

    const pageNumber = parseInt(req.query.pageNumber) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const classes = await prisma.class.findMany({
      where,
      ...paginateUtil.getPaginationParams(req),
      orderBy: { createdAt: "desc" },
    });

    const totalCount = await prisma.class.count({ where });

    // Collect unique classTeacherIds
    const classTeacherIds = classes
      .map((cls) => cls.classTeacherId)
      .filter((id) => id != null);

    // Fetch classTeachers if any exist using findMany
    let classTeacherMap = {};
    if (classTeacherIds.length > 0) {
      const classTeachers = await prisma.user.findMany({
        where: {
          id: { in: classTeacherIds },
          deletedAt: null,
          deletedBy: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          contact: true,
        },
      });

      classTeacherMap = classTeachers.reduce((acc, teacher) => {
        acc[teacher.id] = teacher;
        return acc;
      }, {});
    }

    // Add classTeacher object to each class
    const classesWithTeachers = classes.map((cls) => ({
      ...cls,
      classTeacher: cls.classTeacherId
        ? classTeacherMap[cls.classTeacherId] || null
        : null,
    }));

    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNext = pageNumber < totalPages;

    return res.json({
      message: "Classes fetched!",
      data: classesWithTeachers,
      totalPages,
      hasNext,
    });
  },
);

// PATCH endpoint for editing school
router.patch(
  "/:id",
  withPermission(Permission.EDIT_SCHOOL),
  validateRequest(updateSchoolSchema),
  async (req, res) => {
    const { id } = req.params;
    const updateData = req.body.request || {};
    const currentUser = req.context.user;

    // Check if school exists and is not deleted
    const existingSchool = await prisma.school.findUnique({
      where: { id, deletedAt: null, deletedBy: null },
    });

    if (!existingSchool) {
      return res.status(404).json({ message: "School not found!" });
    }

    // Validate region exists and is not deleted if provided
    if (updateData.regionId != null) {
      const regionEntity = await prisma.region.findFirst({
        where: {
          id: updateData.regionId,
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
    const schoolUpdateData = {};

    if (updateData.name !== undefined) schoolUpdateData.name = updateData.name;
    if (updateData.code !== undefined) schoolUpdateData.code = updateData.code;
    if (updateData.email !== undefined)
      schoolUpdateData.email = updateData.email;
    if (updateData.phone !== undefined)
      schoolUpdateData.phone = updateData.phone;
    if (updateData.address !== undefined)
      schoolUpdateData.address = updateData.address;
    if (updateData.regionId !== undefined)
      schoolUpdateData.regionId = updateData.regionId;
    if (updateData.certificateLink !== undefined)
      schoolUpdateData.certificateLink = updateData.certificateLink;

    schoolUpdateData.updatedBy = currentUser.id;

    const updatedSchool = await prisma.school.update({
      where: { id },
      data: schoolUpdateData,
    });

    return res.json({ message: "School updated!", data: updatedSchool });
  },
);

// PATCH endpoint for editing class
router.patch(
  "/classes/:id",
  withPermission(Permission.EDIT_CLASSES),
  validateRequest(updateClassSchema),
  async (req, res) => {
    const { id } = req.params;
    const updateData = req.body.request || {};
    const currentUser = req.context.user;

    // Check if class exists and is not deleted
    const existingClass = await prisma.class.findUnique({
      where: { id, deletedAt: null, deletedBy: null },
    });

    if (!existingClass) {
      return res.status(404).json({ message: "Class not found!" });
    }

    // Validate class teacher exists and is not deleted if provided
    if (updateData.classTeacherId != null) {
      const teacherEntity = await prisma.user.findFirst({
        where: {
          id: updateData.classTeacherId,
          deletedAt: null,
          deletedBy: null,
        },
      });
      if (!teacherEntity) {
        return res
          .status(404)
          .json({ message: "Teacher not found or deleted!" });
      }
    }

    // Build update data object with only provided fields
    const classUpdateData = {};

    if (updateData.grade !== undefined)
      classUpdateData.grade = updateData.grade;
    if (updateData.division !== undefined)
      classUpdateData.division = updateData.division;
    if (updateData.classTeacherId !== undefined)
      classUpdateData.classTeacherId = updateData.classTeacherId;

    classUpdateData.updatedBy = currentUser.id;

    const updatedClass = await prisma.class.update({
      where: { id },
      data: classUpdateData,
    });

    return res.json({ message: "Class updated!", data: updatedClass });
  },
);

// DELETE endpoint for soft deletion of school
router.delete(
  "/:id",
  withPermission(Permission.DELETE_SCHOOL),
  validateRequest(deleteSchoolSchema),
  async (req, res) => {
    const { id } = req.params;
    const currentUser = req.context.user;

    const existingSchool = await prisma.school.findUnique({
      where: { id, deletedAt: null, deletedBy: null },
    });

    if (!existingSchool) {
      return res.status(404).json({ message: "School not found!" });
    }

    await prisma.school.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: currentUser.id,
      },
    });

    return res.json({ message: "School deleted!" });
  },
);

// DELETE endpoint for soft deletion of class
router.delete(
  "/classes/:id",
  withPermission(Permission.DELETE_CLASSES),
  validateRequest(deleteClassSchema),
  async (req, res) => {
    const { id } = req.params;
    const currentUser = req.context.user;

    const existingClass = await prisma.class.findUnique({
      where: { id, deletedAt: null, deletedBy: null },
    });

    if (!existingClass) {
      return res.status(404).json({ message: "Class not found!" });
    }

    await prisma.class.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: currentUser.id,
      },
    });

    return res.json({ message: "Class deleted!" });
  },
);

export default router;

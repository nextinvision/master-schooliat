import { Router } from "express";
import prisma from "../prisma/client.js";
import withPermission from "../middlewares/with-permission.middleware.js";
import {
  Permission,
  RoleName,
  UserType,
  SalaryComponentFrequency,
  SalaryComponentValueType,
  SalaryComponentType,
} from "../prisma/generated/index.js";
import roleService from "../services/role.service.js";
import paginateUtil from "../utils/paginate.util.js";

const router = Router();

// Helper function to calculate component amount
function calculateComponentAmount(component, basePay) {
  if (component.valueType === SalaryComponentValueType.ABSOLUTE) {
    return component.value;
  } else if (component.valueType === SalaryComponentValueType.PERCENTAGE) {
    return Math.round((component.value * basePay) / 100);
  }
  return 0;
}

// Helper function to calculate monthly amounts from components
function calculateMonthlyAmounts(components, basePay) {
  const monthlyComponents = components.filter(
    (c) => c.frequency === SalaryComponentFrequency.MONTHLY,
  );
  let gross = 0;
  let net = 0;

  for (const component of monthlyComponents) {
    const amount = calculateComponentAmount(component, basePay);
    if (component.type === SalaryComponentType.GROSS) {
      gross += amount;
    }
    if (component.type === SalaryComponentType.NET) {
      net += amount;
    }
  }

  // grossMonthlyAmount includes both GROSS and NET components
  return {
    grossMonthlyAmount: gross + net,
    netMonthlyAmount: net,
  };
}

// GET /salary-structures - List all salary structures
router.get("/", async (req, res) => {
  const { schoolId } = req.query;

  const where = {
    deletedAt: null,
  };

  if (schoolId) {
    where.schoolId = schoolId;
  }

  const salaryStructures = await prisma.salaryStructure.findMany({
    where,
    include: {
      components: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    ...paginateUtil.getPaginationParams(req),
  });

  return res.json({
    message: "Salary structures fetched!",
    data: salaryStructures,
  });
});

// GET /salary-structures/:id - Get salary structure by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const salaryStructure = await prisma.salaryStructure.findUniqueOrThrow({
    where: { id },
  });

  if (salaryStructure.deletedAt) {
    return res.status(404).json({
      message: "Salary structure not found",
    });
  }

  // Fetch components
  const components = await prisma.salaryStructureComponent.findMany({
    where: {
      salaryStructureId: id,
      deletedAt: null,
    },
  });

  return res.json({
    message: "Salary structure fetched!",
    data: {
      ...salaryStructure,
      components,
    },
  });
});

// POST /salary-structures - Create salary structure
router.post("/", async (req, res) => {
  const request = req.body.request;
  const currentUser = req.context.user;

  // Validate school exists
  await prisma.school.findUniqueOrThrow({
    where: { id: request.schoolId },
  });

  // Validate base pay component exists and has correct constraints
  const basePayComponent = request.components.find(
    (c) => c.isBasePayComponent === true,
  );

  if (!basePayComponent) {
    return res.status(400).json({
      message: "Base pay component is required (isBasePayComponent: true)",
    });
  }

  if (
    basePayComponent.frequency !== SalaryComponentFrequency.MONTHLY ||
    basePayComponent.valueType !== SalaryComponentValueType.ABSOLUTE
  ) {
    return res.status(400).json({
      message:
        "Base pay component must have frequency=MONTHLY and valueType=ABSOLUTE",
    });
  }

  const basePay = basePayComponent.value;

  // Calculate monthly amounts
  const { grossMonthlyAmount, netMonthlyAmount } = calculateMonthlyAmounts(
    request.components,
    basePay,
  );

  // Create salary structure
  const newSalaryStructure = await prisma.salaryStructure.create({
    data: {
      name: request.name,
      schoolId: request.schoolId,
      grossMonthlyAmount,
      netMonthlyAmount,
      createdBy: currentUser.id,
    },
  });

  // Create components
  const components = await prisma.salaryStructureComponent.createMany({
    data: request.components.map((component) => ({
      salaryStructureId: newSalaryStructure.id,
      schoolId: request.schoolId,
      name: component.name,
      type: component.type,
      value: component.value,
      valueType: component.valueType,
      frequency: component.frequency,
      isBasePayComponent: component.isBasePayComponent || false,
      createdBy: currentUser.id,
    })),
  });

  // Fetch created components
  const createdComponents = await prisma.salaryStructureComponent.findMany({
    where: {
      salaryStructureId: newSalaryStructure.id,
      deletedAt: null,
    },
  });

  return res.status(201).json({
    message: "Salary structure created!",
    data: {
      ...newSalaryStructure,
      components: createdComponents,
    },
  });
});

// PATCH /salary-structures/:id - Update salary structure
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const request = req.body.request;
  const currentUser = req.context.user;

  // Fetch existing salary structure
  const existingStructure = await prisma.salaryStructure.findUniqueOrThrow({
    where: { id },
  });

  // Fetch existing components
  const existingComponents = await prisma.salaryStructureComponent.findMany({
    where: {
      salaryStructureId: id,
      deletedAt: null,
    },
  });

  if (existingStructure.deletedAt) {
    return res.status(404).json({
      message: "Salary structure not found",
    });
  }

  const updateData = {
    updatedBy: currentUser.id,
  };

  if (request.name) {
    updateData.name = request.name;
  }

  // Handle component updates
  let componentsChanged = false;
  let basePay = null;

  // Find existing base pay component to recalculate amounts if needed
  const existingBasePayComponent = existingComponents.find(
    (c) => c.isBasePayComponent === true,
  );

  if (existingBasePayComponent) {
    basePay = existingBasePayComponent.value;
  }

  // Handle component creations
  if (request.componentsToCreate && request.componentsToCreate.length > 0) {
    componentsChanged = true;

    // Validate base pay component if being created
    const newBasePayComponent = request.componentsToCreate.find(
      (c) => c.isBasePayComponent === true,
    );

    if (newBasePayComponent) {
      if (
        newBasePayComponent.frequency !== SalaryComponentFrequency.MONTHLY ||
        newBasePayComponent.valueType !== SalaryComponentValueType.ABSOLUTE
      ) {
        return res.status(400).json({
          message:
            "Base pay component must have frequency=MONTHLY and valueType=ABSOLUTE",
        });
      }
      basePay = newBasePayComponent.value;
    }

    await prisma.salaryStructureComponent.createMany({
      data: request.componentsToCreate.map((component) => ({
        salaryStructureId: id,
        schoolId: existingStructure.schoolId,
        name: component.name,
        type: component.type,
        value: component.value,
        valueType: component.valueType,
        frequency: component.frequency,
        isBasePayComponent: component.isBasePayComponent || false,
        createdBy: currentUser.id,
      })),
    });
  }

  // Handle component updates
  if (request.componentsToUpdate && request.componentsToUpdate.length > 0) {
    componentsChanged = true;

    for (const componentUpdate of request.componentsToUpdate) {
      const existingComponent = existingComponents.find(
        (c) => c.id === componentUpdate.id,
      );

      if (!existingComponent) {
        continue;
      }

      // Validate base pay component constraints if being updated
      if (
        componentUpdate.isBasePayComponent === true ||
        (componentUpdate.isBasePayComponent === undefined &&
          existingComponent.isBasePayComponent === true)
      ) {
        const finalFrequency =
          componentUpdate.frequency || existingComponent.frequency;
        const finalValueType =
          componentUpdate.valueType || existingComponent.valueType;

        if (
          finalFrequency !== SalaryComponentFrequency.MONTHLY ||
          finalValueType !== SalaryComponentValueType.ABSOLUTE
        ) {
          return res.status(400).json({
            message:
              "Base pay component must have frequency=MONTHLY and valueType=ABSOLUTE",
          });
        }

        if (componentUpdate.value !== undefined) {
          basePay = componentUpdate.value;
        }
      }

      await prisma.salaryStructureComponent.update({
        where: { id: componentUpdate.id },
        data: {
          ...(componentUpdate.name !== undefined && {
            name: componentUpdate.name,
          }),
          ...(componentUpdate.type !== undefined && {
            type: componentUpdate.type,
          }),
          ...(componentUpdate.value !== undefined && {
            value: componentUpdate.value,
          }),
          ...(componentUpdate.valueType !== undefined && {
            valueType: componentUpdate.valueType,
          }),
          ...(componentUpdate.frequency !== undefined && {
            frequency: componentUpdate.frequency,
          }),
          ...(componentUpdate.isBasePayComponent !== undefined && {
            isBasePayComponent: componentUpdate.isBasePayComponent,
          }),
          updatedBy: currentUser.id,
        },
      });
    }
  }

  // Handle component deletions (soft delete)
  if (request.componentsToDelete && request.componentsToDelete.length > 0) {
    componentsChanged = true;

    await prisma.salaryStructureComponent.updateMany({
      where: {
        id: {
          in: request.componentsToDelete,
        },
      },
      data: {
        deletedAt: new Date(),
        deletedBy: currentUser.id,
      },
    });
  }

  // Recalculate amounts if components changed
  if (componentsChanged && basePay !== null) {
    const allComponents = await prisma.salaryStructureComponent.findMany({
      where: {
        salaryStructureId: id,
        deletedAt: null,
      },
    });

    const { grossMonthlyAmount, netMonthlyAmount } = calculateMonthlyAmounts(
      allComponents,
      basePay,
    );

    updateData.grossMonthlyAmount = grossMonthlyAmount;
    updateData.netMonthlyAmount = netMonthlyAmount;
  }

  // Update salary structure
  const updatedStructure = await prisma.salaryStructure.update({
    where: { id },
    data: updateData,
  });

  // Fetch updated components
  const components = await prisma.salaryStructureComponent.findMany({
    where: {
      salaryStructureId: id,
      deletedAt: null,
    },
  });

  return res.json({
    message: "Salary structure updated!",
    data: {
      ...updatedStructure,
      components,
    },
  });
});

// Separate router for salary payments to avoid route conflicts
const paymentRouter = Router();

// GET /salary-payments - Get salary payments by month
paymentRouter.get("/", async (req, res) => {
  const { month, schoolId, userId } = req.query;

  const where = {
    deletedAt: null,
  };

  if (month) {
    where.month = month;
  }

  if (schoolId) {
    where.schoolId = schoolId;
  }

  if (userId) {
    where.userId = userId;
  }

  const salaryPayments = await prisma.salaryPayments.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    ...paginateUtil.getPaginationParams(req),
  });

  // Fetch user details for each payment
  const paymentsWithUsers = await Promise.all(
    salaryPayments.map(async (payment) => {
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          publicUserId: true,
        },
      });
      return {
        ...payment,
        user,
      };
    }),
  );

  return res.json({
    message: "Salary payments fetched!",
    data: paymentsWithUsers,
  });
});

// POST /salary-payments/generate - Generate monthly salary payments
paymentRouter.post("/generate", async (req, res) => {
  const request = req.body.request;
  const currentUser = req.context.user;

  // Validate month format (YYYY-MM)
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(request.month)) {
    return res.status(400).json({
      message: "Invalid month format. Expected YYYY-MM",
    });
  }

  // Parse month to get start and end dates
  const [year, month] = request.month.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  // Get teacher and staff roles
  const teacherRole = await roleService.getRoleByName(RoleName.TEACHER);
  const staffRole = await roleService.getRoleByName(RoleName.STAFF);

  // Get all teachers and staff users for the school
  const users = await prisma.user.findMany({
    where: {
      schoolId: request.schoolId,
      userType: UserType.SCHOOL,
      roleId: {
        in: [teacherRole.id, staffRole.id],
      },
      deletedAt: null,
    },
  });

  const createdPayments = [];

  // Use transaction for atomicity
  await prisma.$transaction(async (tx) => {
    for (const user of users) {
      // Find effective salary structure for this user in the given month
      const salaryAssignment = await tx.salary.findFirst({
        where: {
          userId: user.id,
          schoolId: request.schoolId,
          from: {
            lte: monthStart,
          },
          till: {
            gte: monthEnd,
          },
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!salaryAssignment) {
        // Skip users without active salary assignment
        continue;
      }

      // Get salary structure components with MONTHLY frequency
      const components = await tx.salaryStructureComponent.findMany({
        where: {
          salaryStructureId: salaryAssignment.salaryStructureId,
          frequency: SalaryComponentFrequency.MONTHLY,
          deletedAt: null,
        },
      });

      // Find base pay component
      const basePayComponent = components.find((c) => c.isBasePayComponent);
      if (!basePayComponent) {
        continue;
      }

      const basePay = basePayComponent.value;

      // Calculate component amounts
      const componentAmounts = {};
      let totalAmount = 0;

      for (const component of components) {
        const amount = calculateComponentAmount(component, basePay);
        componentAmounts[component.id] = amount;
        totalAmount += amount;
      }

      // Check if payment already exists for this month and user
      const existingPayment = await tx.salaryPayments.findFirst({
        where: {
          userId: user.id,
          schoolId: request.schoolId,
          month: request.month,
          deletedAt: null,
        },
      });

      if (existingPayment) {
        // Skip if payment already exists
        continue;
      }

      // Create salary payment record
      const salaryPayment = await tx.salaryPayments.create({
        data: {
          schoolId: request.schoolId,
          userId: user.id,
          month: request.month,
          totalAmount,
          componentAmounts,
          createdBy: currentUser.id,
        },
      });

      createdPayments.push(salaryPayment);
    }
  });

  return res.status(201).json({
    message: "Salary payments generated!",
    data: createdPayments,
  });
});

// Separate router for salary assignments (Salary model - mapping structure to user)
const salaryAssignmentRouter = Router();

// GET /salaries - List salary assignments
salaryAssignmentRouter.get("/", async (req, res) => {
  const { schoolId, userId, salaryStructureId } = req.query;

  const where = {
    deletedAt: null,
  };

  if (schoolId) {
    where.schoolId = schoolId;
  }

  if (userId) {
    where.userId = userId;
  }

  if (salaryStructureId) {
    where.salaryStructureId = salaryStructureId;
  }

  const salaries = await prisma.salary.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    ...paginateUtil.getPaginationParams(req),
  });

  // Fetch related user and salary structure info
  const salariesWithDetails = await Promise.all(
    salaries.map(async (salary) => {
      const user = await prisma.user.findUnique({
        where: { id: salary.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          publicUserId: true,
        },
      });

      const salaryStructure = await prisma.salaryStructure.findUnique({
        where: { id: salary.salaryStructureId },
        select: {
          id: true,
          name: true,
          grossMonthlyAmount: true,
          netMonthlyAmount: true,
        },
      });

      return {
        ...salary,
        user,
        salaryStructure,
      };
    }),
  );

  return res.json({
    message: "Salary assignments fetched!",
    data: salariesWithDetails,
  });
});

// GET /salaries/:id - Get salary assignment by ID
salaryAssignmentRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  const salary = await prisma.salary.findUniqueOrThrow({
    where: { id },
  });

  if (salary.deletedAt) {
    return res.status(404).json({
      message: "Salary assignment not found",
    });
  }

  // Fetch related user and salary structure info
  const user = await prisma.user.findUnique({
    where: { id: salary.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      publicUserId: true,
    },
  });

  const salaryStructure = await prisma.salaryStructure.findUnique({
    where: { id: salary.salaryStructureId },
    select: {
      id: true,
      name: true,
      grossMonthlyAmount: true,
      netMonthlyAmount: true,
    },
  });

  return res.json({
    message: "Salary assignment fetched!",
    data: {
      ...salary,
      user,
      salaryStructure,
    },
  });
});

// POST /salaries - Create salary assignment
salaryAssignmentRouter.post("/", async (req, res) => {
  const request = req.body.request;
  const currentUser = req.context.user;

  // Validate school exists
  await prisma.school.findUniqueOrThrow({
    where: { id: request.schoolId },
  });

  // Validate user exists and is a teacher or staff
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: request.userId },
  });

  // Validate user belongs to the school
  if (user.schoolId !== request.schoolId) {
    return res.status(400).json({
      message: "User does not belong to the specified school",
    });
  }

  // Validate user is a teacher or staff
  const teacherRole = await roleService.getRoleByName(RoleName.TEACHER);
  const staffRole = await roleService.getRoleByName(RoleName.STAFF);

  if (user.roleId !== teacherRole.id && user.roleId !== staffRole.id) {
    return res.status(400).json({
      message: "User must be a teacher or staff member",
    });
  }

  // Validate salary structure exists
  await prisma.salaryStructure.findUniqueOrThrow({
    where: { id: request.salaryStructureId },
  });

  // Validate salary structure belongs to the school
  const salaryStructure = await prisma.salaryStructure.findUnique({
    where: { id: request.salaryStructureId },
  });

  if (salaryStructure.schoolId !== request.schoolId) {
    return res.status(400).json({
      message: "Salary structure does not belong to the specified school",
    });
  }

  // Validate date range
  if (new Date(request.from) >= new Date(request.till)) {
    return res.status(400).json({
      message: "Invalid date range. 'from' must be before 'till'",
    });
  }

  // Create salary assignment
  const newSalary = await prisma.salary.create({
    data: {
      schoolId: request.schoolId,
      userId: request.userId,
      salaryStructureId: request.salaryStructureId,
      from: new Date(request.from),
      till: new Date(request.till),
      createdBy: currentUser.id,
    },
  });

  // Fetch created salary with related info
  const userData = await prisma.user.findUnique({
    where: { id: newSalary.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      publicUserId: true,
    },
  });

  const salaryStructureData = await prisma.salaryStructure.findUnique({
    where: { id: newSalary.salaryStructureId },
    select: {
      id: true,
      name: true,
      grossMonthlyAmount: true,
      netMonthlyAmount: true,
    },
  });

  return res.status(201).json({
    message: "Salary assignment created!",
    data: {
      ...newSalary,
      user: userData,
      salaryStructure: salaryStructureData,
    },
  });
});

// PATCH /salaries/:id - Update salary assignment
salaryAssignmentRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const request = req.body.request;
  const currentUser = req.context.user;

  // Fetch existing salary assignment
  const existingSalary = await prisma.salary.findUniqueOrThrow({
    where: { id },
  });

  if (existingSalary.deletedAt) {
    return res.status(404).json({
      message: "Salary assignment not found",
    });
  }

  const updateData = {
    updatedBy: currentUser.id,
  };

  // Update fields if provided
  if (request.salaryStructureId) {
    // Validate salary structure exists
    const salaryStructure = await prisma.salaryStructure.findUnique({
      where: { id: request.salaryStructureId },
    });

    if (!salaryStructure) {
      return res.status(404).json({
        message: "Salary structure not found",
      });
    }

    // Validate salary structure belongs to the same school
    if (salaryStructure.schoolId !== existingSalary.schoolId) {
      return res.status(400).json({
        message: "Salary structure does not belong to the same school",
      });
    }

    updateData.salaryStructureId = request.salaryStructureId;
  }

  if (request.from) {
    updateData.from = new Date(request.from);
  }

  if (request.till) {
    updateData.till = new Date(request.till);
  }

  // Validate date range if both dates are being updated or one is updated
  const fromDate = updateData.from || existingSalary.from;
  const tillDate = updateData.till || existingSalary.till;

  if (fromDate >= tillDate) {
    return res.status(400).json({
      message: "Invalid date range. 'from' must be before 'till'",
    });
  }

  // Update salary assignment
  const updatedSalary = await prisma.salary.update({
    where: { id },
    data: updateData,
  });

  // Fetch updated salary with related info
  const user = await prisma.user.findUnique({
    where: { id: updatedSalary.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      publicUserId: true,
    },
  });

  const salaryStructure = await prisma.salaryStructure.findUnique({
    where: { id: updatedSalary.salaryStructureId },
    select: {
      id: true,
      name: true,
      grossMonthlyAmount: true,
      netMonthlyAmount: true,
    },
  });

  return res.json({
    message: "Salary assignment updated!",
    data: {
      ...updatedSalary,
      user,
      salaryStructure,
    },
  });
});

export {
  paymentRouter,
  salaryAssignmentRouter,
  router as salaryStructureRouter,
};
export default router;

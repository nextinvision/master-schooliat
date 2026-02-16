import prisma from "../prisma/client.js";
import logger from "../config/logger.js";
import pkg from "../prisma/generated/index.js";
const { CircularStatus } = pkg || {};

// Fallback if CircularStatus enum doesn't exist
const StatusEnum = CircularStatus || {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
};
import notificationService from "./notification.service.js";

/**
 * Create circular
 * @param {Object} data - Circular data
 * @returns {Promise<Object>} - Created circular
 */
const createCircular = async (data) => {
  const {
    title,
    content,
    targetRoles = [],
    targetUserIds = [],
    classIds = [],
    attachments = [],
    expiresAt = null,
    schoolId,
    createdBy,
  } = data;

  const circular = await prisma.circular.create({
    data: {
      title,
      content,
      status: StatusEnum.DRAFT,
      targetRoles,
      targetUserIds,
      classIds,
      attachments,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      schoolId,
      createdBy,
    },
  });

  return circular;
};

/**
 * Update circular
 * @param {string} circularId - Circular ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} - Updated circular
 */
const updateCircular = async (circularId, data) => {
  const updateData = { ...data };
  delete updateData.circularId;

  if (updateData.expiresAt) {
    updateData.expiresAt = new Date(updateData.expiresAt);
  }

  const circular = await prisma.circular.update({
    where: { id: circularId },
    data: {
      ...updateData,
      updatedBy: data.updatedBy,
    },
  });

  return circular;
};

/**
 * Publish circular
 * @param {string} circularId - Circular ID
 * @param {string} publishedBy - User ID
 * @returns {Promise<Object>} - Published circular
 */
const publishCircular = async (circularId, publishedBy) => {
  const circular = await prisma.circular.findUnique({
    where: { id: circularId },
  });

  if (!circular) {
    throw new Error("Circular not found");
  }

  // Update status
  const updatedCircular = await prisma.circular.update({
    where: { id: circularId },
    data: {
      status: StatusEnum.PUBLISHED,
      publishedAt: new Date(),
      updatedBy: publishedBy,
    },
  });

  // Send notifications to target users
  const targetUsers = await prisma.user.findMany({
    where: {
      OR: [
        { id: { in: circular.targetUserIds } },
        { role: { name: { in: circular.targetRoles } } },
        ...(circular.classIds.length > 0
          ? [
              {
                studentProfile: {
                  classId: { in: circular.classIds },
                },
              },
            ]
          : []),
      ],
      schoolId: circular.schoolId,
      deletedAt: null,
    },
  });

  // Send notifications
  for (const user of targetUsers) {
    await notificationService.createNotification({
      userId: user.id,
      title: circular.title,
      content: circular.content.substring(0, 200),
      type: "CIRCULAR",
      actionUrl: `/circulars/${circularId}`,
      schoolId: circular.schoolId,
      createdBy: publishedBy,
    });
  }

  return updatedCircular;
};

/**
 * Get circulars
 * @param {string} schoolId - School ID
 * @param {string} userId - User ID (for filtering)
 * @param {Object} filters - Filter options
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Circulars with pagination
 */
const getCirculars = async (schoolId, userId = null, filters = {}, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const where = {
    schoolId,
    deletedAt: null,
    status: CircularStatus.PUBLISHED,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  // If user ID provided, filter by user's role/class
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        studentProfile: {
          include: { class: true },
        },
      },
    });

    if (user) {
          where.OR = [
            { targetRoles: { has: user.role.name } },
            { targetUserIds: { has: userId } },
            ...(user.studentProfile
              ? [{ classIds: { has: user.studentProfile.classId } }]
              : []),
          ];
    }
  }

  const [circulars, total] = await Promise.all([
    prisma.circular.findMany({
      where,
      orderBy: {
        publishedAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.circular.count({ where }),
  ]);

  return {
    circulars,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const circularService = {
  createCircular,
  updateCircular,
  publishCircular,
  getCirculars,
};

export default circularService;


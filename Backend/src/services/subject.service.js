import prisma from "../prisma/client.js";

/**
 * Get subjects for a school
 * @param {string} schoolId - School ID
 * @param {Object} options - Filter and pagination options
 * @returns {Promise<Object>} - Subjects list and total count
 */
const getSubjects = async (schoolId, options = {}) => {
    const { classId, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where = {
        schoolId,
        deletedAt: null,
    };

    const [subjects, total] = await Promise.all([
        prisma.subject.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: "asc" },
        }),
        prisma.subject.count({ where }),
    ]);

    return {
        subjects,
        total,
        totalPages: Math.ceil(total / limit),
    };
};

/**
 * Create a new subject
 * @param {Object} data - Subject data
 * @param {string} data.name - Subject name
 * @param {string} data.code - Subject code (optional)
 * @param {string} data.description - Subject description (optional)
 * @param {string} data.schoolId - School ID
 * @param {string} data.createdBy - User ID of creator
 * @returns {Promise<Object>} - Created subject
 */
const createSubject = async (data) => {
    return await prisma.subject.create({
        data,
    });
};

/**
 * Update an existing subject
 * @param {string} id - Subject ID
 * @param {Object} data - Subject data to update
 * @param {string} schoolId - School ID to verify ownership
 * @param {string} updatedBy - User ID of updater
 * @returns {Promise<Object>} - Updated subject
 */
const updateSubject = async (id, data, schoolId, updatedBy) => {
    const subject = await prisma.subject.findUnique({
        where: { id },
    });

    if (!subject || subject.schoolId !== schoolId || subject.deletedAt) {
        throw new Error("Subject not found");
    }

    return await prisma.subject.update({
        where: { id },
        data: {
            ...data,
            updatedBy,
        },
    });
};

/**
 * Delete a subject
 * @param {string} id - Subject ID
 * @param {string} schoolId - School ID to verify ownership
 * @param {string} deletedBy - User ID of deleter
 * @returns {Promise<Object>} - Deleted subject
 */
const deleteSubject = async (id, schoolId, deletedBy) => {
    const subject = await prisma.subject.findUnique({
        where: { id },
    });

    if (!subject || subject.schoolId !== schoolId || subject.deletedAt) {
        throw new Error("Subject not found");
    }

    // Soft delete
    return await prisma.subject.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            deletedBy,
        },
    });
};

const subjectService = {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
};

export default subjectService;

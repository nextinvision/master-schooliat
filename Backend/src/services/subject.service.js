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

const subjectService = {
    getSubjects,
};

export default subjectService;

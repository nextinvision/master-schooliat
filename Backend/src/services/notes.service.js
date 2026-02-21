import prisma from "../prisma/client.js";
import logger from "../config/logger.js";
import { parsePagination } from "../utils/pagination.util.js";

/**
 * Create note
 * @param {Object} data - Note data
 * @returns {Promise<Object>} - Created note
 */
const createNote = async (data) => {
  const {
    title,
    description = null,
    subjectId,
    classId = null,
    chapter = null,
    topic = null,
    fileId,
    schoolId,
    createdBy,
  } = data;

  const note = await prisma.note.create({
    data: {
      title,
      description,
      subjectId,
      classId,
      chapter,
      topic,
      fileId,
      schoolId,
      createdBy,
    },
  });

  return note;
};

/**
 * Update note
 * @param {string} noteId - Note ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} - Updated note
 */
const updateNote = async (noteId, data) => {
  const updateData = { ...data };
  delete updateData.noteId;

  // Increment version on update
  const currentNote = await prisma.note.findUnique({
    where: { id: noteId },
  });

  if (currentNote) {
    updateData.version = currentNote.version + 1;
  }

  const note = await prisma.note.update({
    where: { id: noteId },
    data: {
      ...updateData,
      updatedBy: data.updatedBy,
    },
  });

  return note;
};

/**
 * Get notes
 * @param {string} schoolId - School ID
 * @param {Object} filters - Filter options
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Notes with pagination
 */
const getNotes = async (schoolId, filters = {}, options = {}) => {
  const { page, limit, skip } = parsePagination(options);

  if (!schoolId) {
    return {
      notes: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };
  }

  const where = {
    schoolId,
    deletedAt: null,
    isActive: true,
  };

  if (filters.subjectId) {
    where.subjectId = filters.subjectId;
  }

  if (filters.classId) {
    where.classId = filters.classId;
  }

  if (filters.chapter) {
    where.chapter = {
      contains: filters.chapter,
      mode: "insensitive",
    };
  }

  if (filters.topic) {
    where.topic = {
      contains: filters.topic,
      mode: "insensitive",
    };
  }

  try {
    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);
    return {
      notes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  } catch (err) {
    logger.warn({ err: err.message, schoolId }, "notes getNotes failed");
    return {
      notes: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };
  }
};

/**
 * Create syllabus
 * @param {Object} data - Syllabus data
 * @returns {Promise<Object>} - Created syllabus
 */
const createSyllabus = async (data) => {
  const {
    title,
    description = null,
    subjectId,
    classId,
    academicYear,
    chapters = null,
    fileId = null,
    schoolId,
    createdBy,
  } = data;

  const syllabus = await prisma.syllabus.create({
    data: {
      title,
      description,
      subjectId,
      classId,
      academicYear,
      chapters,
      fileId,
      schoolId,
      createdBy,
    },
  });

  return syllabus;
};

/**
 * Update syllabus
 * @param {string} syllabusId - Syllabus ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} - Updated syllabus
 */
const updateSyllabus = async (syllabusId, data) => {
  const updateData = { ...data };
  delete updateData.syllabusId;

  // Increment version on update
  const currentSyllabus = await prisma.syllabus.findUnique({
    where: { id: syllabusId },
  });

  if (currentSyllabus) {
    updateData.version = currentSyllabus.version + 1;
  }

  const syllabus = await prisma.syllabus.update({
    where: { id: syllabusId },
    data: {
      ...updateData,
      updatedBy: data.updatedBy,
    },
  });

  return syllabus;
};

/**
 * Get syllabus
 * @param {string} schoolId - School ID
 * @param {Object} filters - Filter options
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Syllabus with pagination
 */
const getSyllabus = async (schoolId, filters = {}, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const where = {
    schoolId,
    deletedAt: null,
    isActive: true,
  };

  if (filters.subjectId) {
    where.subjectId = filters.subjectId;
  }

  if (filters.classId) {
    where.classId = filters.classId;
  }

  if (filters.academicYear) {
    where.academicYear = filters.academicYear;
  }

  const [syllabus, total] = await Promise.all([
    prisma.syllabus.findMany({
      where,
      orderBy: {
        academicYear: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.syllabus.count({ where }),
  ]);

  return {
    syllabus,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const notesService = {
  createNote,
  updateNote,
  getNotes,
  createSyllabus,
  updateSyllabus,
  getSyllabus,
};

export default notesService;


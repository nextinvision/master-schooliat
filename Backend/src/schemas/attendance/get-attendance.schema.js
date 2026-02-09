import { z } from "zod";

const getAttendanceSchema = z
  .object({
    request: z.object({}).strip(),
    query: z
      .object({
        studentId: z.string().uuid("Invalid student ID").optional(),
        classId: z.string().uuid("Invalid class ID").optional(),
        startDate: z.string().datetime().or(z.date()).optional(),
        endDate: z.string().datetime().or(z.date()).optional(),
        date: z.string().datetime().or(z.date()).optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default("20"),
      })
      .strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default getAttendanceSchema;


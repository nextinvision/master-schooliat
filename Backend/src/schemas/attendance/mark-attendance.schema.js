import { z } from "zod";
import { AttendanceStatus } from "../../prisma/generated/index.js";

const markAttendanceSchema = z
  .object({
    request: z
      .object({
        studentId: z.string().uuid("Invalid student ID"),
        classId: z.string().uuid("Invalid class ID"),
        date: z.string().datetime().or(z.date()),
        status: z.nativeEnum(AttendanceStatus),
        periodId: z.string().uuid("Invalid period ID").optional().nullable(),
        lateArrivalTime: z.string().datetime().or(z.date()).optional().nullable(),
        absenceReason: z.string().max(500, "Absence reason too long").optional().nullable(),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default markAttendanceSchema;


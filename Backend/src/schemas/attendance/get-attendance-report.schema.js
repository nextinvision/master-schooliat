import { z } from "zod";
import { AttendanceStatus } from "../../prisma/generated/index.js";

const getAttendanceReportSchema = z
  .object({
    request: z.object({}),
    query: z
      .object({
        studentId: z.string().uuid("Invalid student ID").optional(),
        classId: z.string().uuid("Invalid class ID").optional(),
        schoolId: z.string().uuid("Invalid school ID").optional(),
        startDate: z.string().datetime().or(z.date()),
        endDate: z.string().datetime().or(z.date()),
        status: z.nativeEnum(AttendanceStatus).optional(),
        format: z.enum(["json", "pdf", "excel"]).optional().default("json"),
      })
      ,
    params: z.object({}),
  })
  ;

export default getAttendanceReportSchema;


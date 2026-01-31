import { z } from "zod";

const getStudentInstallmentsSchema = z
  .object({
    request: z.object({}).strip().optional(),
    query: z.object({}).strip(),
    params: z
      .object({
        studentId: z.string().uuid("Student ID must be a valid UUID"),
      })
      .strip(),
  })
  .strip();

export default getStudentInstallmentsSchema;

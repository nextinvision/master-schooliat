import { z } from "zod";

const createClassesSchema = z.object({
  request: z
    .array(
      z.object({
        id: z
          .string()
          .uuid("ID must be a valid UUID")
          .optional()
          .nullable(),
        grade: z.string().trim().min(1, "Grade is required"),
        division: z.string().trim().optional().nullable(),
        classTeacherId: z
          .string()
          .uuid("Class teacher ID must be a valid UUID")
          .optional()
          .nullable(),
        defaultAnnualFee: z.coerce.number().int().min(0).optional().nullable(),
        defaultMonthlyFee: z.coerce.number().int().min(0).optional().nullable(),
      }),
    )
    .min(1, "At least one class is required"),
  query: z.object({}),
  params: z.object({}),
});

export default createClassesSchema;

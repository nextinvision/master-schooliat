import { z } from "zod";

const createClassesSchema = z
  .object({
    request: z
      .array(
        z
          .object({
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
          })
          .strip(),
      )
      .min(1, "At least one class is required"),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default createClassesSchema;

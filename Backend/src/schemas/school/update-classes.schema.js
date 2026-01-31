import { z } from "zod";

const updateClassesSchema = z
  .object({
    request: z
      .array(
        z
          .object({
            id: z.string().uuid("ID must be a valid UUID"),
            grade: z.string().trim().min(1, "Grade cannot be empty").optional(),
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

export default updateClassesSchema;

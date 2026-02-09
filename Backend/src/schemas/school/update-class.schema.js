import { z } from "zod";

const updateClassSchema = z
  .object({
    request: z
      .object({
        grade: z.string().trim().min(1, "Grade cannot be empty").optional(),
        division: z.string().trim().optional().nullable(),
        classTeacherId: z
          .string()
          .uuid("Class teacher ID must be a valid UUID")
          .optional()
          .nullable(),
      })
      ,
    query: z.object({}),
    params: z
      .object({
        id: z.string().uuid("ID must be a valid UUID"),
      })
      ,
  })
  ;

export default updateClassSchema;

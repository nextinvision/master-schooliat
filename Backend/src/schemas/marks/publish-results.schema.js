import { z } from "zod";

const publishResultsSchema = z
  .object({
    request: z
      .object({
        examId: z.string().uuid("Invalid exam ID"),
        classId: z.string().uuid("Invalid class ID").optional().nullable(),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default publishResultsSchema;


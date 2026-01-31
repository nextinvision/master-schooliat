import { z } from "zod";

const deleteExamCalendarItemSchema = z
  .object({
    request: z.object({}).strip(),
    query: z.object({}).strip(),
    params: z
      .object({
        id: z.string().uuid("ID must be a valid UUID"),
      })
      .strip(),
  })
  .strip();

export default deleteExamCalendarItemSchema;

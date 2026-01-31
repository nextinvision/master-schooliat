import { z } from "zod";

const generateIdCardsSchema = z
  .object({
    request: z.object({}).strip(),
    query: z.object({}).strip(),
    params: z
      .object({
        classId: z.string().uuid("Class ID must be a valid UUID"),
      })
      .strip(),
  })
  .strip();

export default generateIdCardsSchema;

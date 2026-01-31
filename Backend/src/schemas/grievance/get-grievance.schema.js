import { z } from "zod";

const getGrievanceSchema = z
  .object({
    request: z.object({}).strip(),
    query: z.object({}).strip(),
    params: z
      .object({
        id: z.string().uuid("Grievance ID must be a valid UUID"),
      })
      .strip(),
  })
  .strip();

export default getGrievanceSchema;

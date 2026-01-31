import { z } from "zod";

const updateRegionSchema = z
  .object({
    request: z
      .object({
        name: z
          .string()
          .trim()
          .min(1, "Region name cannot be empty")
          .optional(),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z
      .object({
        id: z.string().uuid("ID must be a valid UUID"),
      })
      .strip(),
  })
  .strip();

export default updateRegionSchema;

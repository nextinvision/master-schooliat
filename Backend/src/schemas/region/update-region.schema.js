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
      ,
    query: z.object({}),
    params: z
      .object({
        id: z.string().uuid("ID must be a valid UUID"),
      })
      ,
  })
  ;

export default updateRegionSchema;

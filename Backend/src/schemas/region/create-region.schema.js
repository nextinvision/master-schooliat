import { z } from "zod";

const createRegionSchema = z
  .object({
    request: z
      .object({
        name: z.string().trim().min(1, "Region name is required"),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default createRegionSchema;

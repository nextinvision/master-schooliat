import { z } from "zod";

const createRegionSchema = z
  .object({
    request: z
      .object({
        name: z.string().trim().min(1, "Region name is required"),
      })
      ,
    query: z.object({}),
    params: z.object({}),
  })
  ;

export default createRegionSchema;

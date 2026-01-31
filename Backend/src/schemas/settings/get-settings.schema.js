import { z } from "zod";

const getSettingsSchema = z
  .object({
    request: z.object({}).strip().optional(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default getSettingsSchema;

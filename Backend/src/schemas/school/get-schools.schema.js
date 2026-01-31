import { z } from "zod";

const getSchoolsSchema = z
  .object({
    request: z.object({}).strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default getSchoolsSchema;

import { z } from "zod";

const getMySchoolSchema = z
  .object({
    request: z.object({}).strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default getMySchoolSchema;

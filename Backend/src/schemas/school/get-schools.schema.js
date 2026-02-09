import { z } from "zod";

const getSchoolsSchema = z
  .object({
    request: z.object({}),
    query: z.object({}),
    params: z.object({}),
  })
  ;

export default getSchoolsSchema;

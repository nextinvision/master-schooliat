import { z } from "zod";

const deleteTeacherSchema = z
  .object({
    request: z.object({}),
    query: z.object({}),
    params: z
      .object({
        id: z.string().uuid("ID must be a valid UUID"),
      })
      ,
  })
  ;

export default deleteTeacherSchema;

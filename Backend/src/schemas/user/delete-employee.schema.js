import { z } from "zod";

const deleteEmployeeSchema = z
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

export default deleteEmployeeSchema;

import { z } from "zod";

const deleteNoticeSchema = z
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

export default deleteNoticeSchema;

import { z } from "zod";

const deleteNoticeSchema = z
  .object({
    request: z.object({}).strip(),
    query: z.object({}).strip(),
    params: z
      .object({
        id: z.string().uuid("ID must be a valid UUID"),
      })
      .strip(),
  })
  .strip();

export default deleteNoticeSchema;

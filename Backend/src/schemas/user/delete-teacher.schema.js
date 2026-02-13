import { z } from "zod";

const deleteTeacherSchema = z
  .object({
    request: z.object({}),
    query: z.object({}),
    params: z
      .object({
        id: z.string().uuid("ID must be a valid UUID"),
      }),
    body: z
      .object({
        otpId: z.string().uuid().optional(),
        otpCode: z.string().optional(),
      })
      .optional(),
  })
  ;

export default deleteTeacherSchema;

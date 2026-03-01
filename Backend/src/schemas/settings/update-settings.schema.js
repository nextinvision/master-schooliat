import { z } from "zod";

const updateSettingsSchema = z
  .object({
    request: z
      .object({
        studentFeeInstallments: z
          .number()
          .int()
          .optional(),
        studentFeeAmount: z
          .number()
          .int()
          .optional(),
        currentInstallmentNumber: z
          .number()
          .int()
          .optional(),
        logoId: z
          .string()
          .uuid("Logo ID must be a valid UUID")
          .optional()
          .nullable(),
        platformConfig: z
          .record(z.any())
          .optional(),
      })
      ,
    query: z.object({}),
    params: z.object({}),
  })
  ;

export default updateSettingsSchema;

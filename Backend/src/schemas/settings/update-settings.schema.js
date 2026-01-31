import { z } from "zod";

const updateSettingsSchema = z
  .object({
    request: z
      .object({
        studentFeeInstallments: z
          .number()
          .int()
          // .min(1, "Number of installments must be at least 1")
          // .max(24, "Number of installments cannot exceed 24")
          .optional(),
        studentFeeAmount: z
          .number()
          .int()
          // .min(0, "Fee amount cannot be negative")
          .optional(),
        currentInstallmentNumber: z
          .number()
          .int()
          // .min(1, "Current installment number must be at least 1")
          .optional(),
        logoId: z
          .string()
          .uuid("Logo ID must be a valid UUID")
          .optional()
          .nullable(),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default updateSettingsSchema;

import { z } from "zod";

const cancelInstallmentSchema = z.object({
  request: z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
    reason: z.string().trim().max(500).optional().nullable(),
  }),
  query: z.object({}),
  params: z.object({
    id: z.string().uuid("Installment ID must be a valid UUID"),
  }),
});

export default cancelInstallmentSchema;

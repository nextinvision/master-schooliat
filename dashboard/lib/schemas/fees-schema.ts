import { z } from "zod";

export const paymentSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .min(0.01, "Amount must be at least 0.01"),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;


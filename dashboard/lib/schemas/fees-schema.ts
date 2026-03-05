import { z } from "zod";

export const paymentSchema = z.object({
  amount: z.number().min(0).optional(),
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "CHEQUE", "UPI", "CREDIT_CARD", "DEBIT_CARD"]).optional(),
  isWaiver: z.boolean().optional(),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
  otp: z.string().length(6, "OTP must be 6 digits"),
}).refine(
  (data) => {
    if (data.isWaiver) return true;
    return data.amount !== undefined && data.amount > 0 && data.paymentMethod !== undefined;
  },
  {
    message: "Amount and Payment Method are required unless applying a waiver.",
    path: ["amount"],
  }
);

export type PaymentFormData = z.infer<typeof paymentSchema>;

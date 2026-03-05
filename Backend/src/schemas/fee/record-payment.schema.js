import { z } from "zod";

import { PaymentMethod } from "../../prisma/generated/index.js";

const recordPaymentSchema = z
  .object({
    request: z
      .object({
        amount: z.number().int().min(1, "Payment amount must be at least 1").optional(),
        paymentMethod: z.nativeEnum(PaymentMethod).optional(),
        isWaiver: z.boolean().optional(),
        transactionId: z.string().optional(),
        remarks: z.string().optional(),
        otp: z.string().length(6, "OTP must be 6 digits"),
      })
      .refine(
        (data) => {
          if (data.isWaiver) return true;
          return data.amount !== undefined && data.paymentMethod !== undefined;
        },
        {
          message: "Amount and PaymentMethod are required unless applying a waiver.",
        }
      ),
    query: z.object({}),
    params: z
      .object({
        id: z.string().uuid("Installment ID must be a valid UUID"),
      })
    ,
  })
  ;

export default recordPaymentSchema;

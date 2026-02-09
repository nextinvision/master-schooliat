import { z } from "zod";

const recordPaymentSchema = z
  .object({
    request: z
      .object({
        amount: z.number().int().min(1, "Payment amount must be at least 1"),
      })
      ,
    query: z.object({}),
    params: z
      .object({
        id: z.string().uuid("Installment ID must be a valid UUID"),
      })
      ,
  })
  ;

export default recordPaymentSchema;

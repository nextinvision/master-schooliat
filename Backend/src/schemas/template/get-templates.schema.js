import { z } from "zod";

const getTemplatesSchema = z
  .object({
    query: z
      .object({
        type: z
          .enum(["ID_CARD", "RESULT", "INVENTORY_RECEIPT", "FEE_RECEIPT"])
          .optional(),
      })
      .strip(),
    params: z.object({}).strip(),
    request: z.object({}).strip().optional(),
  })
  .strip();

export default getTemplatesSchema;

import { z } from "zod";

const requestOTPSchema = z
  .object({
    request: z
      .object({
        email: z.string().trim().email("Invalid email format"),
        purpose: z.enum(["verification", "password-reset", "login", "deletion"]).optional().default("verification"),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default requestOTPSchema;


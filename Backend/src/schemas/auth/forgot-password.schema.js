import { z } from "zod";

const forgotPasswordSchema = z
  .object({
    request: z
      .object({
        email: z.string().trim().email("Invalid email format"),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default forgotPasswordSchema;


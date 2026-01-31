import { z } from "zod";

const authenticateSchema = z
  .object({
    request: z
      .object({
        email: z.string().trim().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default authenticateSchema;

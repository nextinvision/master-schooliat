import { z } from "zod";

const authenticateSchema = z
  .object({
    request: z
      .object({
        email: z.string().trim().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
      })
      ,
    query: z.object({}),
    params: z.object({}),
  })
  ;

export default authenticateSchema;

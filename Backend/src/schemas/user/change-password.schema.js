import { z } from "zod";

const changePasswordSchema = z
  .object({
    request: z
      .object({
        currentPassword: z
          .string()
          .trim()
          .min(1, "Current password is required"),
        newPassword: z.string().trim().min(1, "New password is required"),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default changePasswordSchema;

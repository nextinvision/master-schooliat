import { z } from "zod";

export const feesConfigSchema = z.object({
  studentFeeInstallments: z
    .string()
    .min(1, "Number of installments is required")
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 1;
    }, "Installments must be at least 1"),
  studentFeeAmount: z
    .string()
    .min(1, "Fee amount is required")
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    }, "Fee amount must be 0 or greater"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type FeesConfigFormData = z.infer<typeof feesConfigSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;


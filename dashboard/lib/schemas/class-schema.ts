import { z } from "zod";

const optionalNonNegInt = z.preprocess(
  (val) => (val === "" || val === undefined ? null : val),
  z.coerce.number().int().min(0).nullable().optional(),
);

export const classItemSchema = z.object({
  id: z.string().nullable().optional(),
  grade: z.string().min(1, "Grade is required"),
  division: z.string().nullable().optional(),
  classTeacherId: z.string().nullable().optional(),
  defaultAnnualFee: optionalNonNegInt,
  defaultMonthlyFee: optionalNonNegInt,
});

export const classesSchema = z.array(classItemSchema).min(1, "At least one class is required");

export type ClassItem = z.infer<typeof classItemSchema>;
export type ClassesFormData = z.infer<typeof classesSchema>;


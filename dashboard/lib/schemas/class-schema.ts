import { z } from "zod";

export const classItemSchema = z.object({
  id: z.string().nullable().optional(),
  grade: z.string().min(1, "Grade is required"),
  division: z.string().nullable().optional(),
  classTeacherId: z.string().nullable().optional(),
});

export const classesSchema = z.array(classItemSchema).min(1, "At least one class is required");

export type ClassItem = z.infer<typeof classItemSchema>;
export type ClassesFormData = z.infer<typeof classesSchema>;


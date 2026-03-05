import { z } from "zod";

export interface AddTeacherFormData {
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE";
  dob: string;
  designation: string;
  contact: string;
  email: string;
  areaStreet: string;
  location: string;
  district: string;
  pincode: string;
  state: string;
  highestQualification: string;
  university: string;
  yearOfPassing: string;
  percentage: string;
  transportMode: "Transport" | "Non Transport";
  transportId: string;
  registrationPhotoId: string | null;
  aadhaarId: string;
  panCardNumber: string;
  subjects: string;
  basicSalary?: number;
}

export interface EditTeacherFormData extends AddTeacherFormData {
  dateOfBirth: string; // Legacy field name in some places
}

// Base schema for common fields
const baseTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  gender: z.enum(["MALE", "FEMALE"], { message: "Gender is required" }),
  dob: z.string().min(1, "Date of birth is required"),
  designation: z.string().min(1, "Designation is required").trim(),
  contact: z
    .string()
    .min(10, "Contact must be 10 digits")
    .max(10, "Contact must be 10 digits")
    .regex(/^[6-9]\d{9}$/, "Contact must be a valid 10-digit Indian mobile number"),
  email: z.string().email("Invalid email address").trim(),
  areaStreet: z.string().default(""),
  location: z.string().default(""),
  district: z.string().default(""),
  pincode: z
    .string()
    .default("")
    .refine((val) => !val || /^\d{6}$/.test(val), "Pincode must be exactly 6 digits"),
  state: z.string().default(""),
  highestQualification: z.string().default(""),
  university: z.string().default(""),
  yearOfPassing: z
    .string()
    .default("")
    .refine((val) => !val || /^\d{4}$/.test(val), "Year must be exactly 4 digits"),
  percentage: z.string().default(""),
  transportMode: z.enum(["Transport", "Non Transport"], {
    message: "Transport mode is required",
  }),
  transportId: z.string().default(""),
  registrationPhotoId: z.string().nullable().default(null),
  aadhaarId: z
    .string()
    .default("")
    .refine((val) => !val || /^\d{12}$/.test(val), "Aadhaar ID must be exactly 12 digits"),
  panCardNumber: z
    .string()
    .default("")
    .refine((val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val.toUpperCase()), "Invalid PAN card number format")
    .transform((val) => val ? val.toUpperCase() : ""),
  basicSalary: z.number().min(0, "Salary cannot be negative").optional(),
});

// Schema for adding a teacher
export const addTeacherSchema = baseTeacherSchema.extend({
  subjects: z.string().min(1, "Subjects are required").trim(),
});

// Schema for editing a teacher (inherits from addTeacherSchema and adds dateOfBirth)
export const editTeacherSchema = addTeacherSchema.extend({
  dateOfBirth: z.string().default(""), // Legacy field name in some places
});

// Apply explicit types for consistency
export const addTeacherSchemaWithRefinement: z.ZodType<AddTeacherFormData, any, any> = addTeacherSchema.refine(
  (data) => {
    if (data.transportMode === "Transport") {
      return !!data.transportId && data.transportId.trim() !== "";
    }
    return true;
  },
  {
    message: "Transport selection is required when Transport mode is selected",
    path: ["transportId"],
  }
);

export const editTeacherSchemaWithRefinement: z.ZodType<EditTeacherFormData, any, any> = editTeacherSchema.refine(
  (data) => {
    if (data.transportMode === "Transport") {
      return !!data.transportId && data.transportId.trim() !== "";
    }
    return true;
  },
  {
    message: "Transport selection is required when Transport mode is selected",
    path: ["transportId"],
  }
);

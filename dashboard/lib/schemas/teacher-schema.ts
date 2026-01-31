import { z } from "zod";

// Base teacher schema for add
export const addTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  gender: z.enum(["MALE", "FEMALE"], { message: "Gender is required" }),
  dob: z.string().min(1, "Date of birth is required"),
  designation: z.string().min(1, "Designation is required").trim(),
  contact: z
    .string()
    .min(10, "Contact must be 10 digits")
    .max(10, "Contact must be 10 digits")
    .regex(/^\d{10}$/, "Contact must be exactly 10 digits"),
  email: z.string().email("Invalid email address").trim(),
  areaStreet: z.string().min(1, "Area and street is required").trim(),
  location: z.string().min(1, "Location is required").trim(),
  district: z.string().min(1, "District is required").trim(),
  pincode: z
    .string()
    .min(6, "Pincode must be 6 digits")
    .max(6, "Pincode must be 6 digits")
    .regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  state: z.string().min(1, "State is required").trim(),
  highestQualification: z
    .string()
    .min(1, "Highest qualification is required")
    .trim(),
  university: z.string().min(1, "University is required").trim(),
  yearOfPassing: z
    .string()
    .min(4, "Year of passing must be 4 digits")
    .max(4, "Year of passing must be 4 digits")
    .regex(/^\d{4}$/, "Year must be exactly 4 digits"),
  percentage: z.string().min(1, "Percentage/Grade is required").trim(),
  transportMode: z.enum(["Transport", "Non Transport"], {
    message: "Transport mode is required",
  }),
  transportId: z.string().optional(),
  registrationPhotoId: z.string().nullable().optional(),
  aadhaarId: z
    .string()
    .min(12, "Aadhaar ID must be 12 digits")
    .max(12, "Aadhaar ID must be 12 digits")
    .regex(/^\d{12}$/, "Aadhaar ID must be exactly 12 digits"),
  panCardNumber: z
    .string()
    .min(10, "PAN card number must be 10 characters")
    .max(10, "PAN card number must be 10 characters")
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN card number format")
    .transform((val) => val.toUpperCase()),
});

// Extended schema for edit (includes subjects)
export const editTeacherSchema = addTeacherSchema.extend({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  subjects: z.string().min(1, "Subjects are required").trim(),
});

// Refine validation for transport
export const addTeacherSchemaWithRefinement = addTeacherSchema.refine(
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

export const editTeacherSchemaWithRefinement = editTeacherSchema.refine(
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

export type AddTeacherFormData = z.infer<typeof addTeacherSchemaWithRefinement>;
export type EditTeacherFormData = z.infer<typeof editTeacherSchemaWithRefinement>;


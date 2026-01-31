import { z } from "zod";

// Base schema for student form
const baseStudentSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  dob: z.string().min(1, "Date of birth is required"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
  email: z.string().email("Invalid email address"),
  areaStreet: z.string().min(1, "Area and Street is required"),
  location: z.string().min(1, "Location is required"),
  district: z.string().min(1, "District is required"),
  pincode: z
    .string()
    .min(6, "Pincode must be 6 digits")
    .regex(/^\d+$/, "Pincode must contain only digits"),
  state: z.string().min(1, "State is required"),
  fatherName: z.string().min(1, "Father Name is required"),
  fatherContact: z
    .string()
    .min(10, "Father Contact must be at least 10 digits")
    .regex(/^\d+$/, "Father Contact must contain only digits"),
  motherName: z.string().min(1, "Mother Name is required"),
  motherContact: z
    .string()
    .min(10, "Mother Contact must be at least 10 digits")
    .regex(/^\d+$/, "Mother Contact must contain only digits"),
  fatherIncome: z
    .string()
    .min(1, "Family Annual Income is required")
    .regex(/^\d+$/, "Income must contain only digits"),
  fatherOccupation: z.string().min(1, "Father Occupation is required"),
  classId: z.string().min(1, "Class is required"),
  accommodationType: z.enum(["DAY_SCHOLAR", "HOSTELLER"]),
  transportMode: z.enum(["Transport", "Non Transport"]),
  transportId: z.string().optional(),
  registrationPhotoId: z.string().nullable().optional(),
  aadhaarNumber: z.string().optional(),
  apaarId: z.string().optional(),
  bloodGroup: z.string().optional(),
  rollNumber: z.string().optional(),
});

// Schema for adding student (photo required)
export const addStudentSchema = baseStudentSchema.refine(
  (data) => {
    if (data.transportMode === "Transport") {
      return !!data.transportId;
    }
    return true;
  },
  {
    message: "Transport selection is required when Transport mode is selected",
    path: ["transportId"],
  }
).refine(
  (data) => !!data.registrationPhotoId,
  {
    message: "Student photo is required",
    path: ["registrationPhotoId"],
  }
);

// Schema for editing student (photo optional)
export const editStudentSchema = baseStudentSchema.refine(
  (data) => {
    if (data.transportMode === "Transport") {
      return !!data.transportId;
    }
    return true;
  },
  {
    message: "Transport selection is required when Transport mode is selected",
    path: ["transportId"],
  }
);

export const studentSchema = addStudentSchema;

export type StudentFormData = z.infer<typeof baseStudentSchema>;


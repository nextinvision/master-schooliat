import { z } from "zod";

const createSchoolSchema = z
  .object({
    request: z
      .object({
        name: z.string().trim().min(1, "School name is required"),
        email: z.string().trim().email("Invalid email format"),
        phone: z.string().trim().min(1, "Phone is required"),
        address: z
          .array(z.string().trim().min(1, "Address line cannot be empty"))
          .min(1, "At least one address line is required"),
        code: z.string().trim().min(1, "School code is required"),
        gstNumber: z.string().trim().optional(),
        principalName: z.string().trim().optional(),
        principalEmail: z.string().trim().email("Invalid email").optional().or(z.literal("")),
        principalPhone: z.string().trim().optional(),
        establishedYear: z.string().trim().optional(),
        boardAffiliation: z.string().trim().optional(),
        studentStrength: z.string().trim().optional(),
        certificateLink: z.string().trim().url("Invalid URL").optional().or(z.literal("")),
        bankName: z.string().trim().optional(),
        bankAccountNumber: z.string().trim().optional(),
        bankIfscCode: z.string().trim().optional(),
        bankBranchName: z.string().trim().optional(),
      })
    ,
    query: z.object({}),
    params: z.object({}),
  })
  ;

export default createSchoolSchema;

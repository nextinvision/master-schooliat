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
      })
      ,
    query: z.object({}),
    params: z.object({}),
  })
  ;

export default createSchoolSchema;

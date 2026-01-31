import { z } from "zod";

const updateSchoolSchema = z
  .object({
    request: z
      .object({
        name: z
          .string()
          .trim()
          .min(1, "School name cannot be empty")
          .optional(),
        code: z
          .string()
          .trim()
          .min(1, "School code cannot be empty")
          .optional(),
        email: z.string().trim().email("Invalid email format").optional(),
        phone: z.string().trim().min(1, "Phone cannot be empty").optional(),
        address: z
          .array(z.string().trim().min(1, "Address line cannot be empty"))
          .min(1, "At least one address line is required")
          .optional(),
        regionId: z.string().uuid("Region ID must be a valid UUID").optional(),
        certificateLink: z
          .string()
          .trim()
          .url("Certificate link must be a valid URL")
          .optional()
          .nullable(),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z
      .object({
        id: z.string().uuid("ID must be a valid UUID"),
      })
      .strip(),
  })
  .strip();

export default updateSchoolSchema;

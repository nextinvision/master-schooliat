import { z } from "zod";

const getExamCalendarItemsSchema = z
  .object({
    request: z.object({}).strip(),
    query: z
      .object({
        examCalendarId: z
          .string()
          .uuid("Exam calendar ID must be a valid UUID")
          .optional(),
        pageNumber: z
          .string()
          .trim()
          .optional()
          .refine(
            (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) > 0),
            "Page number must be a positive integer",
          ),
        pageSize: z
          .string()
          .trim()
          .optional()
          .refine(
            (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) > 0),
            "Page size must be a positive integer",
          ),
      })
      .strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default getExamCalendarItemsSchema;

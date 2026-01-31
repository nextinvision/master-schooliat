import { z } from "zod";

const updateGrievanceSchema = z
  .object({
    request: z
      .object({
        status: z
          .enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"], {
            errorMap: () => ({
              message: "Status must be OPEN, IN_PROGRESS, RESOLVED, or CLOSED",
            }),
          })
          .optional(),
        priority: z
          .enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
            errorMap: () => ({
              message: "Priority must be LOW, MEDIUM, HIGH, or URGENT",
            }),
          })
          .optional(),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z
      .object({
        id: z.string().uuid("Grievance ID must be a valid UUID"),
      })
      .strip(),
  })
  .strip();

export default updateGrievanceSchema;

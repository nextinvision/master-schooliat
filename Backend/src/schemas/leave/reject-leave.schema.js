import { z } from "zod";

const rejectLeaveSchema = z
  .object({
    request: z
      .object({
        leaveRequestId: z.string().uuid("Invalid leave request ID"),
        rejectionReason: z.string().max(500, "Rejection reason too long").optional().nullable(),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default rejectLeaveSchema;


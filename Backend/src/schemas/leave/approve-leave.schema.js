import { z } from "zod";

const approveLeaveSchema = z
  .object({
    request: z
      .object({
        leaveRequestId: z.string().uuid("Invalid leave request ID"),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default approveLeaveSchema;


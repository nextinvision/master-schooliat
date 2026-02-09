import { z } from "zod";

const sendMessageSchema = z
  .object({
    request: z
      .object({
        conversationId: z.string().uuid("Invalid conversation ID"),
        content: z.string().min(1, "Message content is required").max(5000, "Message too long"),
        attachments: z.array(z.string().uuid("Invalid file ID")).optional().default([]),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default sendMessageSchema;


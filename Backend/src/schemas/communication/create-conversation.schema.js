import { z } from "zod";
import { ConversationType } from "../../prisma/generated/index.js";

const createConversationSchema = z
  .object({
    request: z
      .object({
        participants: z.array(z.string().uuid("Invalid user ID")).min(1, "At least one participant required"),
        type: z.nativeEnum(ConversationType),
        title: z.string().max(200, "Title too long").optional().nullable(),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export default createConversationSchema;


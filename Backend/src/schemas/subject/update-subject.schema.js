import { z } from "zod";

const updateSubjectSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid subject ID"),
    }),
    request: z.object({
        name: z.string().min(1, "Subject name is required").max(100).optional(),
        code: z.string().max(50).optional(),
        description: z.string().max(500).optional(),
    }),
    query: z.object({}),
});

export default updateSubjectSchema;

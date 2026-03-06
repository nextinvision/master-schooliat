import { z } from "zod";

const createSubjectSchema = z.object({
    request: z.object({
        name: z.string().min(1, "Subject name is required").max(100),
        code: z.string().max(50).optional(),
        description: z.string().max(500).optional(),
    }),
    query: z.object({}),
    params: z.object({}),
});

export default createSubjectSchema;

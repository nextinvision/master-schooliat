import { z } from "zod";

const getSubjectsSchema = z.object({
    request: z.object({}),
    query: z.object({
        classId: z.string().uuid().optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default("20"),
    }),
    params: z.object({}),
});

export default getSubjectsSchema;

import { z } from "zod";

const deleteSubjectSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid subject ID"),
    }),
});

export default deleteSubjectSchema;

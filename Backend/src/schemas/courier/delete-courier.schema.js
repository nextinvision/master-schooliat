import { z } from "zod";

const deleteCourierSchema = z.object({
  request: z.object({}),
  query: z.object({}),
  params: z.object({
    id: z.string().uuid("Courier ID must be a valid UUID"),
  }),
});

export default deleteCourierSchema;

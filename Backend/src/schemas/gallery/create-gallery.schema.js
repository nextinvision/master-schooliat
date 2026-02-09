import { z } from "zod";
import pkg from "../../prisma/generated/index.js";
const { GalleryPrivacy } = pkg;

const createGallerySchema = z.object({
  request: z.object({
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    description: z.string().optional().nullable(),
    eventId: z.string().uuid("Invalid event ID").optional().nullable(),
    privacy: z.nativeEnum(GalleryPrivacy).optional().default(GalleryPrivacy.PUBLIC),
    classId: z.string().uuid("Invalid class ID").optional().nullable(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export default createGallerySchema;


import { z } from "zod";

const createAttendancePeriodSchema = z
  .object({
    request: z
      .object({
        name: z.string().min(1, "Period name is required").max(50, "Period name too long"),
        startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
        endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
      })
      .strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

const getAttendancePeriodsSchema = z
  .object({
    request: z.object({}).strip(),
    query: z.object({}).strip(),
    params: z.object({}).strip(),
  })
  .strip();

export { createAttendancePeriodSchema, getAttendancePeriodsSchema };


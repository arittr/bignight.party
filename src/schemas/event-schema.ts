import { z } from "zod";

// Event slug validation: lowercase letters, numbers, and hyphens only
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const eventCreateSchema = z.object({
  description: z.string().optional(),
  eventDate: z.coerce.date({
    message: "Event date is required and must be a valid date",
  }),
  name: z.string().min(1, "Event name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(slugRegex, "Slug must contain only lowercase letters, numbers, and hyphens"),
});

export const eventUpdateSchema = z.object({
  description: z.string().optional(),
  eventDate: z.coerce
    .date({
      message: "Event date must be a valid date",
    })
    .optional(),
  id: z.string().cuid("Invalid event ID"),
  name: z.string().min(1, "Event name is required").optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(slugRegex, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
});

export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;

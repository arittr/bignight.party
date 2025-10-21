import { WorkType } from "@prisma/client";
import { z } from "zod";

// Year validation: reasonable range for works (1900-2100)
const currentYear = new Date().getFullYear();
const minYear = 1900;
const maxYear = currentYear + 10; // Allow future releases

export const workCreateSchema = z.object({
  externalId: z.string().optional(),
  imageUrl: z.string().url("Poster URL must be a valid URL").optional(),
  title: z.string().min(1, "Title is required"),
  type: z.nativeEnum(WorkType, {
    message: "Work type is required",
  }),
  year: z
    .number()
    .int()
    .min(minYear, `Year must be ${minYear} or later`)
    .max(maxYear, `Year must be ${maxYear} or earlier`)
    .optional(),
});

export const workUpdateSchema = z.object({
  externalId: z.string().optional(),
  id: z.string().cuid("Invalid work ID"),
  imageUrl: z.string().url("Poster URL must be a valid URL").optional(),
  title: z.string().min(1, "Title is required").optional(),
  type: z.nativeEnum(WorkType).optional(),
  year: z
    .number()
    .int()
    .min(minYear, `Year must be ${minYear} or later`)
    .max(maxYear, `Year must be ${maxYear} or earlier`)
    .optional(),
});

export type WorkCreateInput = z.infer<typeof workCreateSchema>;
export type WorkUpdateInput = z.infer<typeof workUpdateSchema>;

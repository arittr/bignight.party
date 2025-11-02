import { z } from "zod";

export const categoryCreateSchema = z.object({
  eventId: z.string().cuid("Invalid event ID"),
  isRevealed: z.boolean().optional(),
  name: z.string().min(1, "Category name is required"),
  order: z.number().int().nonnegative("Order must be 0 or greater"),
  points: z.number().int().positive("Points must be greater than 0").optional(),
  winnerNominationId: z.string().cuid("Invalid nomination ID").optional(),
});

export const categoryUpdateSchema = z.object({
  eventId: z.string().cuid("Invalid event ID").optional(),
  id: z.string().cuid("Invalid category ID"),
  isRevealed: z.boolean().optional(),
  name: z.string().min(1, "Category name is required").optional(),
  order: z.number().int().nonnegative("Order must be 0 or greater").optional(),
  points: z.number().int().positive("Points must be greater than 0").optional(),
  winnerNominationId: z.string().cuid("Invalid nomination ID").optional(),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

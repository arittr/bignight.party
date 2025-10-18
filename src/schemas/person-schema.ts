import { z } from "zod";

export const personCreateSchema = z.object({
  externalId: z.string().optional(),
  imageUrl: z.string().url("Image URL must be a valid URL").optional(),
  name: z.string().min(1, "Person name is required"),
});

export const personUpdateSchema = z.object({
  externalId: z.string().optional(),
  id: z.string().cuid("Invalid person ID"),
  imageUrl: z.string().url("Image URL must be a valid URL").optional(),
  name: z.string().min(1, "Person name is required").optional(),
});

export type PersonCreateInput = z.infer<typeof personCreateSchema>;
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>;

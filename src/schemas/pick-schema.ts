import { z } from "zod";

/**
 * Schema for submitting or updating a pick
 * Used by submitPickAction to validate user input
 */
export const pickSubmissionSchema = z.object({
  gameId: z.string().cuid("Invalid game ID"),
  categoryId: z.string().cuid("Invalid category ID"),
  nominationId: z.string().cuid("Invalid nomination ID"),
});

export type PickSubmissionInput = z.infer<typeof pickSubmissionSchema>;

import { z } from "zod";

/**
 * Schema for submitting or updating a pick
 * Used by submitPickAction to validate user input
 */
export const pickSubmissionSchema = z.object({
  categoryId: z.string().cuid("Invalid category ID"),
  gameId: z.string().cuid("Invalid game ID"),
  nominationId: z.string().cuid("Invalid nomination ID"),
});

export type PickSubmissionInput = z.infer<typeof pickSubmissionSchema>;

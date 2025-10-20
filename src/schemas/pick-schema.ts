import { z } from "zod";

export const pickSubmissionSchema = z.object({
  gameId: z.string().cuid(),
  categoryId: z.string().cuid(),
  nominationId: z.string().cuid(),
});

export type PickSubmissionInput = z.infer<typeof pickSubmissionSchema>;

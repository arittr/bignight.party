import { oc } from "@orpc/contract";
import { z } from "zod";
import type { Pick } from "@prisma/client";
import { pickSubmissionSchema } from "@/schemas/pick-schema";

/**
 * Pick Contracts - User pick submission operations
 *
 * Covers: Submitting picks for categories in games
 * All procedures require authentication
 */

/**
 * Submit or update a pick for a category in a game
 * Validates:
 * - User is a participant in the game
 * - Game is in OPEN status and picks not locked
 * - Category exists in the game's event
 * - Nomination exists in the category
 *
 * Returns the created/updated Pick record
 */
export const submitPickContract = oc.input(pickSubmissionSchema).output(
	z.object({
		success: z.boolean(),
		pick: z.object({
			id: z.string(),
			gameId: z.string(),
			userId: z.string(),
			categoryId: z.string(),
			nominationId: z.string(),
			createdAt: z.date(),
			updatedAt: z.date(),
		}),
	})
);

/**
 * Combined pick router contract
 * Export for router implementation
 */
export const pickContract = oc.router({
	submitPick: submitPickContract,
});

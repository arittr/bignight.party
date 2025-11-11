import { oc } from "@orpc/contract";
import { z } from "zod";
import type { Game, GameParticipant } from "@prisma/client";
import { joinGameSchema } from "@/schemas/game-schema";

/**
 * Game Contracts - User-facing game operations
 *
 * Covers: Joining games, fetching user's games
 * All procedures require authentication
 */

/**
 * Join a game using game ID and access code
 * Creates GameParticipant record if user not already a member
 * Validates access code matches the game
 */
export const joinContract = oc.input(joinGameSchema).output(
	z.object({
		id: z.string(),
		userId: z.string(),
		gameId: z.string(),
		joinedAt: z.date(),
		createdAt: z.date(),
		updatedAt: z.date(),
	})
);

/**
 * Get all games the authenticated user has joined
 * Returns games with event info and participant counts
 */
export const getUserGamesContract = oc.input(z.void()).output(
	z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			status: z.enum(["SETUP", "OPEN", "LIVE", "COMPLETED"]),
			accessCode: z.string(),
			picksLockAt: z.date().nullable(),
			eventId: z.string(),
			createdAt: z.date(),
			updatedAt: z.date(),
			event: z.object({
				id: z.string(),
				name: z.string(),
				eventDate: z.date(),
			}),
			_count: z.object({
				participants: z.number(),
				picks: z.number(),
			}),
		})
	)
);

/**
 * Combined game contract
 * Hierarchical object for router implementation
 */
export const gameContract = {
	join: joinContract,
	getUserGames: getUserGamesContract,
};

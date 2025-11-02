import { oc } from "@orpc/contract";
import { z } from "zod";
import type { Game, GameParticipant } from "@prisma/client";
import { joinGameSchema, resolveAccessCodeSchema } from "@/schemas/game-schema";

/**
 * Game Contracts - User-facing game operations
 *
 * Covers: Joining games, resolving access codes, fetching user's games
 * All procedures require authentication (except resolveAccessCode)
 */

/**
 * Join a game by game ID
 * Creates GameParticipant record if user not already a member
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
 * Resolve an access code to a game ID
 * Returns game information and membership status
 * Used for join flow: user enters code → resolves to game → joins
 */
export const resolveAccessCodeContract = oc.input(resolveAccessCodeSchema).output(
	z.object({
		gameId: z.string(),
		gameName: z.string(),
		eventName: z.string(),
		isMember: z.boolean(),
		canJoin: z.boolean(), // Based on game status
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
	resolveAccessCode: resolveAccessCodeContract,
	getUserGames: getUserGamesContract,
};

import { implement } from "@orpc/server";
import { authenticatedProcedure } from "@/lib/api/procedures";
import { gameContract } from "@/lib/api/contracts/game";
import * as gameService from "@/lib/services/game-service";

/**
 * Game Router - Game operations requiring authentication
 *
 * Uses contract-first pattern with implement(gameContract)
 * All procedures use authenticatedProcedure (user must be logged in)
 * Provides user context via ctx.userId
 */

// Create typed builder from contract
const os = implement(gameContract);

/**
 * Join a game by gameId
 * User must be authenticated
 */
const join = os.join.use(authenticatedProcedure).handler(async ({ input, ctx }) => {
  return gameService.joinGame(ctx.userId, input.gameId);
});

/**
 * Resolve access code to gameId and check if user is already a member
 * Returns { gameId, gameName, eventName, isMember, canJoin }
 */
const resolveAccessCode = os.resolveAccessCode
  .use(authenticatedProcedure)
  .handler(async ({ input, ctx }) => {
    return gameService.resolveAccessCode(input.accessCode, ctx.userId);
  });

/**
 * Get all games for the current user with completion status
 */
const getUserGames = os.getUserGames
  .use(authenticatedProcedure)
  .handler(async ({ ctx }) => {
    return gameService.getUserGames(ctx.userId);
  });

/**
 * Game Router - Implements gameContract with full type safety
 */
export const gameRouter = os.router({
  join,
  resolveAccessCode,
  getUserGames,
});

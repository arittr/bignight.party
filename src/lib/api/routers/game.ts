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
const gameBuilder = implement(gameContract);

/**
 * Game Router - Implements gameContract with full type safety
 */
export const gameRouter = gameBuilder.router({
  /**
   * Join a game by gameId
   * User must be authenticated
   */
  join: gameBuilder.join.use(authenticatedProcedure).handler(async ({ input, ctx }) => {
    return gameService.joinGame(ctx.userId, input.gameId);
  }),

  /**
   * Resolve access code to gameId and check if user is already a member
   * Returns { gameId, gameName, eventName, isMember, canJoin }
   */
  resolveAccessCode: gameBuilder.resolveAccessCode
    .use(authenticatedProcedure)
    .handler(async ({ input, ctx }) => {
      return gameService.resolveAccessCode(input.accessCode, ctx.userId);
    }),

  /**
   * Get all games for the current user with completion status
   */
  getUserGames: gameBuilder.getUserGames
    .use(authenticatedProcedure)
    .handler(async ({ ctx }) => {
      return gameService.getUserGames(ctx.userId);
    }),
});

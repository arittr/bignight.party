import { authenticatedProcedure } from "@/lib/api/procedures";
import * as gameService from "@/lib/services/game-service";

/**
 * Game Router - Game operations requiring authentication
 *
 * All procedures use authenticatedProcedure (user must be logged in)
 * Provides user context via ctx.userId
 */

export const gameRouter = {
  /**
   * Join a game by gameId
   * User must be authenticated
   */
  join: authenticatedProcedure.handler(async ({ input, ctx }: any) => {
    return gameService.joinGame(ctx.userId, input.gameId);
  }),

  /**
   * Resolve access code to gameId and check if user is already a member
   * Returns { gameId, isMember }
   */
  resolveAccessCode: authenticatedProcedure.handler(async ({ input, ctx }: any) => {
    return gameService.resolveAccessCode(input.accessCode, ctx.userId);
  }),

  /**
   * Get all games for the current user with completion status
   */
  getUserGames: authenticatedProcedure.handler(async ({ ctx }: any) => {
    return gameService.getUserGames(ctx.userId);
  }),
};

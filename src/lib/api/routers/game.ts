import { implement } from "@orpc/server";
import { authMiddleware } from "@/lib/api/procedures";
import { gameContract } from "@/lib/api/contracts/game";
import * as gameService from "@/lib/services/game-service";

/**
 * Game Router - Game operations requiring authentication
 *
 * Uses contract-first pattern with implement(gameContract)
 * All procedures use authMiddleware (user must be logged in)
 * Provides user context via ctx.userId
 */

// Create typed builder from contract
const os = implement(gameContract);

/**
 * Game Router - Implements gameContract with full type safety
 */
export const gameRouter = os.router({
  join: os.join.use(authMiddleware).handler(async ({ input, context }) => {
    return gameService.joinGame(context.userId, input.gameId);
  }),
  resolveAccessCode: os.resolveAccessCode
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    return gameService.resolveAccessCode(input.accessCode, context.userId);
  }),
  getUserGames: os.getUserGames
  .use(authMiddleware)
  .handler(async ({ context }) => {
    return gameService.getUserGames(context.userId);
  }),
});

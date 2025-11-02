import { implement } from "@orpc/server";
import { authenticatedProcedure } from "@/lib/api/procedures";
import { pickContract } from "@/lib/api/contracts/pick";
import * as pickService from "@/lib/services/pick-service";

/**
 * Pick Router - Pick submission operations requiring authentication
 *
 * Uses contract-first pattern with implement(pickContract)
 * All procedures use authenticatedProcedure (user must be logged in)
 * Provides user context via ctx.userId
 */

// Create typed builder from contract
const pickBuilder = implement(pickContract);

/**
 * Pick Router - Implements pickContract with full type safety
 */
export const pickRouter = pickBuilder.router({
  /**
   * Submit or update a pick for the current user
   * Validates user is a game participant and game is accepting picks
   */
  submitPick: pickBuilder.submitPick
    .use(authenticatedProcedure)
    .handler(async ({ input, ctx }) => {
      return pickService.submitPick(ctx.userId, {
        gameId: input.gameId,
        categoryId: input.categoryId,
        nominationId: input.nominationId,
      });
    }),
});

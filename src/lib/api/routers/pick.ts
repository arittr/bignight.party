import { authenticatedProcedure } from "@/lib/api/procedures";
import * as pickService from "@/lib/services/pick-service";

/**
 * Pick Router - Pick submission operations requiring authentication
 *
 * All procedures use authenticatedProcedure (user must be logged in)
 * Provides user context via ctx.userId
 */

export const pickRouter = {
  /**
   * Submit or update a pick for the current user
   * Validates user is a game participant and game is accepting picks
   */
  submitPick: authenticatedProcedure.handler(async ({ input, ctx }: any) => {
    return pickService.submitPick(ctx.userId, {
      gameId: input.gameId,
      categoryId: input.categoryId,
      nominationId: input.nominationId,
    });
  }),
};

import { implement } from "@orpc/server";
import { authMiddleware } from "@/lib/api/procedures";
import { pickContract } from "@/lib/api/contracts/pick";
import * as pickService from "@/lib/services/pick-service";

/**
 * Pick Router - Pick submission operations requiring authentication
 *
 * Uses contract-first pattern with implement(pickContract)
 * All procedures use authMiddleware (user must be logged in)
 * Provides user context via ctx.userId
 */

// Create typed builder from contract
const os = implement(pickContract);

/**
 * Pick Router - Implements pickContract with full type safety
 */
export const pickRouter = os.router({
  submitPick: os.submitPick
  .use(authMiddleware)
  .handler(async ({ input, context }) => {
    return pickService.submitPick(context.userId, {
      gameId: input.gameId,
      categoryId: input.categoryId,
      nominationId: input.nominationId,
    });
  }),
});

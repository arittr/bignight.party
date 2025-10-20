"use server";

import { authenticatedAction } from "@/lib/actions/safe-action";
import { joinGameSchema, resolveAccessCodeSchema } from "@/schemas/game-schema";
import * as gameService from "@/lib/services/game-service";

/**
 * Join a game by gameId
 * Creates GameParticipant record for authenticated user
 */
export const joinGameAction = authenticatedAction
  .schema(joinGameSchema)
  .action(async ({ parsedInput, ctx }) => {
    return gameService.joinGame(ctx.userId, parsedInput.gameId);
  });

/**
 * Resolve access code to gameId and check if user is member
 * Returns: { gameId: string, isMember: boolean }
 */
export const resolveAccessCodeAction = authenticatedAction
  .schema(resolveAccessCodeSchema)
  .action(async ({ parsedInput, ctx }) => {
    return gameService.resolveAccessCode(parsedInput.accessCode, ctx.userId);
  });

"use server";

import { authenticatedAction } from "@/lib/actions/safe-action";
import { pickSubmissionSchema } from "@/schemas/pick-schema";
import * as pickService from "@/lib/services/pick-service";

/**
 * Submit a pick for a category in a game
 * Upserts pick (allows changing selections)
 * Validates:
 * - User is game participant
 * - Game status is OPEN
 * - Nomination belongs to category
 */
export const submitPickAction = authenticatedAction
  .schema(pickSubmissionSchema)
  .action(async ({ parsedInput, ctx }) => {
    return pickService.submitPick(ctx.userId, parsedInput);
  });

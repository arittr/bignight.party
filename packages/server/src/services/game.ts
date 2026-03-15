import { eq, and } from "drizzle-orm";
import { categories, nominations, gameConfig } from "../db/schema";
import type { Db } from "../db/connection";
import type { GamePhase } from "@bignight/shared";

export async function markWinner(db: Db, categoryId: string, nominationId: string) {
  await db.transaction(async (tx) => {
    // Verify nomination belongs to category
    const nom = await tx
      .select()
      .from(nominations)
      .where(and(eq(nominations.id, nominationId), eq(nominations.categoryId, categoryId)))
      .limit(1);

    if (nom.length === 0) {
      throw new Error("Nomination does not belong to category");
    }

    // Set winner and reveal
    await tx
      .update(categories)
      .set({ winnerId: nominationId, isRevealed: true })
      .where(eq(categories.id, categoryId));

    // Check if all categories are now revealed
    const allCats = await tx.select().from(categories);
    const allRevealed = allCats.every((c) => c.isRevealed);

    if (allRevealed) {
      await tx
        .update(gameConfig)
        .set({ completedAt: Date.now() })
        .where(eq(gameConfig.id, 1));
    }
  });
}

export async function clearWinner(db: Db, categoryId: string) {
  await db
    .update(categories)
    .set({ winnerId: null, isRevealed: false })
    .where(eq(categories.id, categoryId));

  // If game was marked complete, reset completedAt since we just un-revealed a category
  await db
    .update(gameConfig)
    .set({ completedAt: null })
    .where(eq(gameConfig.id, 1));
}

export function getGamePhase(
  config: { completedAt: number | null },
  hasCategories: boolean,
  hasRevealedCategory: boolean,
): GamePhase {
  if (!hasCategories) return "setup";
  if (config.completedAt) return "completed";
  if (hasRevealedCategory) return "locked";
  return "open";
}

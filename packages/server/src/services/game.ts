import { eq, and } from "drizzle-orm";
import { categories, nominations, gameConfig } from "../db/schema";
import type { Db } from "../db/connection";
import type { GamePhase } from "@bignight/shared";

export async function markWinner(db: Db, categoryId: string, nominationId: string) {
  // Verify nomination belongs to category
  const nom = await db
    .select()
    .from(nominations)
    .where(and(eq(nominations.id, nominationId), eq(nominations.categoryId, categoryId)))
    .limit(1);

  if (nom.length === 0) {
    throw new Error("Nomination does not belong to category");
  }

  // Set winner and reveal
  await db
    .update(categories)
    .set({ winnerId: nominationId, isRevealed: true })
    .where(eq(categories.id, categoryId));

  // Check if all categories are now revealed
  const allCats = await db.select().from(categories);
  const allRevealed = allCats.every((c) => c.isRevealed);

  if (allRevealed) {
    await db
      .update(gameConfig)
      .set({ completedAt: Date.now() })
      .where(eq(gameConfig.id, 1));
  }
}

export async function clearWinner(db: Db, categoryId: string) {
  await db
    .update(categories)
    .set({ winnerId: null, isRevealed: false })
    .where(eq(categories.id, categoryId));
}

export function getGamePhase(
  config: { picksLockAt: number | null; completedAt: number | null },
  hasCategories: boolean,
): GamePhase {
  if (!hasCategories) return "setup";
  if (config.completedAt) return "completed";
  if (config.picksLockAt && config.picksLockAt < Date.now()) return "locked";
  return "open";
}

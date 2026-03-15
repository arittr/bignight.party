import { Hono } from "hono";
import { count, eq } from "drizzle-orm";
import { categories, gameConfig } from "../db/schema";
import { getLeaderboard } from "../services/leaderboard";
import type { Db } from "../db/connection";
import type { AppEnv } from "../env";
import type { GamePhase } from "@bignight/shared";

export function gameRoutes(db: Db) {
  const router = new Hono<AppEnv>();

  router.get("/", async (c) => {
    const [config] = await db.select().from(gameConfig).limit(1);
    const allCats = await db.select().from(categories);
    const categoryCount = allCats.length;
    const hasRevealed = allCats.some((cat) => cat.isRevealed);

    const phase = derivePhase(config, categoryCount, hasRevealed);

    return c.json({ phase, config, categoryCount });
  });

  router.get("/leaderboard", async (c) => {
    const allCategories = await db.select().from(categories);
    const revealedCount = allCategories.filter((cat) => cat.isRevealed).length;
    const totalCount = allCategories.length;
    const players = await getLeaderboard(db);

    return c.json({ players, revealedCount, totalCount });
  });

  return router;
}

function derivePhase(
  config: { completedAt: number | null } | undefined,
  categoryCount: number,
  hasRevealed: boolean,
): GamePhase {
  if (!config || categoryCount === 0) return "setup";
  if (config.completedAt != null) return "completed";
  if (hasRevealed) return "locked";
  return "open";
}

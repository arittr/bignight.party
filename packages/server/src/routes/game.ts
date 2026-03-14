import { Hono } from "hono";
import { count } from "drizzle-orm";
import { categories, gameConfig } from "../db/schema";
import type { Db } from "../db/connection";
import type { AppEnv } from "../env";
import type { GamePhase } from "@bignight/shared";

export function gameRoutes(db: Db) {
  const router = new Hono<AppEnv>();

  router.get("/", async (c) => {
    const [config] = await db.select().from(gameConfig).limit(1);
    const [{ value: categoryCount }] = await db
      .select({ value: count() })
      .from(categories);

    const phase = derivePhase(config, categoryCount);

    return c.json({ phase, config, categoryCount });
  });

  return router;
}

function derivePhase(
  config: { picksLockAt: number | null; completedAt: number | null } | undefined,
  categoryCount: number,
): GamePhase {
  if (!config || categoryCount === 0) return "setup";
  if (config.completedAt != null) return "completed";
  if (config.picksLockAt != null && config.picksLockAt <= Date.now()) return "locked";
  return "open";
}

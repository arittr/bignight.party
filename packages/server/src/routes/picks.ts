import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { SubmitPickSchema } from "@bignight/shared";
import { picks, nominations, players, gameConfig } from "../db/schema";
import { authMiddleware } from "../auth/middleware";
import type { Db } from "../db/connection";
import type { AppEnv } from "../env";

export function picksRoutes(db: Db) {
  const router = new Hono<AppEnv>();

  router.use("/*", authMiddleware);

  router.post("/", zValidator("json", SubmitPickSchema), async (c) => {
    const playerId = c.get("playerId");
    const { categoryId, nominationId } = c.req.valid("json");

    // Verify player still exists (JWT may outlive a DB reset)
    const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
    if (!player) {
      return c.json({ error: "Player not found — please sign in again" }, 401);
    }

    const [config] = await db.select().from(gameConfig).limit(1);

    if (config?.completedAt != null) {
      return c.json({ error: "Game is completed" }, 403);
    }

    if (config?.picksLockAt != null && config.picksLockAt <= Date.now()) {
      return c.json({ error: "Picks are locked" }, 403);
    }

    // Verify nomination belongs to the specified category
    const [nomination] = await db
      .select()
      .from(nominations)
      .where(and(eq(nominations.id, nominationId), eq(nominations.categoryId, categoryId)))
      .limit(1);

    if (!nomination) {
      return c.json({ error: "Nomination does not belong to the specified category" }, 400);
    }

    const now = Date.now();
    const id = createId();

    await db
      .insert(picks)
      .values({ id, playerId, categoryId, nominationId, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: [picks.playerId, picks.categoryId],
        set: { nominationId, updatedAt: now },
      });

    const [pick] = await db
      .select()
      .from(picks)
      .where(and(eq(picks.playerId, playerId), eq(picks.categoryId, categoryId)))
      .limit(1);

    return c.json({ pick });
  });

  router.get("/", async (c) => {
    const playerId = c.get("playerId");

    const playerPicks = await db
      .select()
      .from(picks)
      .where(eq(picks.playerId, playerId));

    return c.json({ picks: playerPicks });
  });

  return router;
}

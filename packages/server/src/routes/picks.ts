import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { SubmitPickSchema } from "@bignight/shared";
import { picks, nominations, players, categories } from "../db/schema";
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

    // Wrap lock check + insert in a transaction to prevent race with winner reveal
    const result = await db.transaction(async (tx) => {
      // Picks lock when any category has been revealed (first winner announced)
      const allCats = await tx.select().from(categories);
      const hasRevealed = allCats.some((cat) => cat.isRevealed);

      if (hasRevealed) {
        return { error: "Picks are locked", status: 403 as const };
      }

      // Verify nomination belongs to the specified category
      const [nomination] = await tx
        .select()
        .from(nominations)
        .where(and(eq(nominations.id, nominationId), eq(nominations.categoryId, categoryId)))
        .limit(1);

      if (!nomination) {
        return { error: "Nomination does not belong to the specified category", status: 400 as const };
      }

      const now = Date.now();
      const id = createId();

      await tx
        .insert(picks)
        .values({ id, playerId, categoryId, nominationId, createdAt: now, updatedAt: now })
        .onConflictDoUpdate({
          target: [picks.playerId, picks.categoryId],
          set: { nominationId, updatedAt: now },
        });

      const [pick] = await tx
        .select()
        .from(picks)
        .where(and(eq(picks.playerId, playerId), eq(picks.categoryId, categoryId)))
        .limit(1);

      return { pick };
    });

    if ("error" in result) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json({ pick: result.pick });
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

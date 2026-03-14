import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { eq } from "drizzle-orm";
import {
  AdminLoginSchema,
  ImportWikipediaSchema,
  MarkWinnerSchema,
  ClearWinnerSchema,
  SetPicksLockSchema,
} from "@bignight/shared";
import { signToken } from "../auth/token";
import { authMiddleware, adminMiddleware } from "../auth/middleware";
import { categories, nominations, picks, gameConfig } from "../db/schema";
import { markWinner, clearWinner } from "../services/game";
import { getLeaderboard } from "../services/leaderboard";
import { previewImport, importFromWikipedia } from "../services/wikipedia";
import type { Db } from "../db/connection";
import type { AppEnv } from "../env";

const ResetSchema = z.object({ confirm: z.literal(true) });

export function adminRoutes(db: Db) {
  const router = new Hono<AppEnv>();

  // Login does not require auth
  router.post("/login", zValidator("json", AdminLoginSchema), async (c) => {
    const { pin } = c.req.valid("json");
    const adminPin = process.env.ADMIN_PIN;
    if (!adminPin || pin !== adminPin) {
      return c.json({ error: "Invalid PIN" }, 401);
    }
    const token = await signToken({ playerId: "admin", isAdmin: true });
    return c.json({ token });
  });

  // All remaining routes require admin auth
  router.use("/*", authMiddleware, adminMiddleware);

  router.post("/preview", zValidator("json", ImportWikipediaSchema), async (c) => {
    const { url } = c.req.valid("json");
    try {
      const parsed = await previewImport(url);
      return c.json(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      return c.json({ error: message }, 400);
    }
  });

  router.post("/import", zValidator("json", ImportWikipediaSchema), async (c) => {
    const { url } = c.req.valid("json");
    try {
      const parsed = await importFromWikipedia(url, db);
      return c.json(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      return c.json({ error: message }, 400);
    }
  });

  router.post("/mark-winner", zValidator("json", MarkWinnerSchema), async (c) => {
    const { categoryId, nominationId } = c.req.valid("json");
    try {
      await markWinner(db, categoryId, nominationId);
      const leaderboard = await getLeaderboard(db);
      return c.json({ leaderboard });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to mark winner";
      return c.json({ error: message }, 404);
    }
  });

  router.post("/clear-winner", zValidator("json", ClearWinnerSchema), async (c) => {
    const { categoryId } = c.req.valid("json");
    await clearWinner(db, categoryId);
    const leaderboard = await getLeaderboard(db);
    return c.json({ leaderboard });
  });

  router.put("/lock", zValidator("json", SetPicksLockSchema), async (c) => {
    const { picksLockAt } = c.req.valid("json");
    await db
      .update(gameConfig)
      .set({ picksLockAt })
      .where(eq(gameConfig.id, 1));
    return c.json({ picksLockAt });
  });

  router.post("/reset", async (c) => {
    const body = await c.req.json();
    const result = ResetSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: "Must provide { confirm: true } to reset" }, 400);
    }

    // Delete in order respecting foreign keys
    await db.delete(picks);
    await db.delete(nominations);
    await db.delete(categories);
    await db
      .update(gameConfig)
      .set({ picksLockAt: null, completedAt: null })
      .where(eq(gameConfig.id, 1));

    return c.json({ ok: true });
  });

  return router;
}

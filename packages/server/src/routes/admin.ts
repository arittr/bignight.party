import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { eq } from "drizzle-orm";
import {
  AdminLoginSchema,
  ImportWikipediaSchema,
  MarkWinnerSchema,
  ClearWinnerSchema,
} from "@bignight/shared";
import type { Server as SocketIOServer } from "socket.io";
import { WEBSOCKET_EVENTS } from "@bignight/shared";
import { signToken } from "../auth/token";
import { authMiddleware, adminMiddleware } from "../auth/middleware";
import { categories, nominations, picks, players, gameConfig } from "../db/schema";
import { markWinner, clearWinner } from "../services/game";
import { getLeaderboard } from "../services/leaderboard";
import { previewImport, importFromWikipedia } from "../services/wikipedia";
import type { Db } from "../db/connection";
import type { AppEnv } from "../env";

const ResetSchema = z.object({ confirm: z.literal(true) });

export function adminRoutes(db: Db, io?: SocketIOServer) {
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

      // Look up category + winner names for the "Just Announced" banner
      const [cat] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
      const [nom] = await db.select().from(nominations).where(eq(nominations.id, nominationId)).limit(1);
      const allCats = await db.select().from(categories);
      const revealedCount = allCats.filter((c) => c.isRevealed).length;

      if (io) {
        io.to("game").emit(WEBSOCKET_EVENTS.LEADERBOARD_UPDATE, {
          players: leaderboard,
          revealedCategory: cat && nom ? { name: cat.name, winnerTitle: nom.title } : undefined,
          revealedCount,
          totalCount: allCats.length,
        });

        if (allCats.every((c) => c.isRevealed)) {
          io.to("game").emit(WEBSOCKET_EVENTS.GAME_COMPLETED, { completedAt: Date.now() });
        }
      }

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

    const allCats = await db.select().from(categories);
    const revealedCount = allCats.filter((c) => c.isRevealed).length;

    if (io) {
      io.to("game").emit(WEBSOCKET_EVENTS.LEADERBOARD_UPDATE, {
        players: leaderboard,
        revealedCount,
        totalCount: allCats.length,
      });
    }

    return c.json({ leaderboard });
  });

  router.post("/reset", async (c) => {
    const body = await c.req.json();
    const result = ResetSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: "Must provide { confirm: true } to reset" }, 400);
    }

    // Clear winnerId FKs first (breaks circular ref), then delete
    await db.update(categories).set({ winnerId: null });
    await db.delete(picks);
    await db.delete(nominations);
    await db.delete(categories);
    await db
      .update(gameConfig)
      .set({ completedAt: null })
      .where(eq(gameConfig.id, 1));

    return c.json({ ok: true });
  });

  router.get("/players", async (c) => {
    const allPlayers = await db.select().from(players);
    const allCats = await db.select().from(categories);
    const allPicks = await db.select().from(picks);

    const totalCategories = allCats.length;
    const picksByPlayer = new Map<string, number>();
    for (const pick of allPicks) {
      picksByPlayer.set(pick.playerId, (picksByPlayer.get(pick.playerId) ?? 0) + 1);
    }

    const result = allPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      pickCount: picksByPlayer.get(p.id) ?? 0,
      totalCategories,
      complete: (picksByPlayer.get(p.id) ?? 0) >= totalCategories,
    }));

    return c.json({ players: result });
  });

  return router;
}

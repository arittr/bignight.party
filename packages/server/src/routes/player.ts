import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreatePlayerSchema } from "@bignight/shared";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { players } from "../db/schema";
import { hashPin, verifyPin } from "../auth/pin";
import { signToken } from "../auth/token";
import { authMiddleware } from "../auth/middleware";
import type { Db } from "../db/connection";
import type { AppEnv } from "../env";

export function playerRoutes(db: Db) {
  const router = new Hono<AppEnv>();

  router.post("/join", zValidator("json", CreatePlayerSchema), async (c) => {
    const { name, pin } = c.req.valid("json");

    const existing = await db.select().from(players).where(eq(players.name, name)).limit(1);

    if (existing.length > 0) {
      const valid = await verifyPin(pin, existing[0].pin);
      if (!valid) {
        return c.json({ error: "Invalid PIN" }, 401);
      }
      const token = await signToken({ playerId: existing[0].id, isAdmin: false });
      return c.json({ token, playerId: existing[0].id, name: existing[0].name });
    }

    const id = createId();
    const hashedPin = await hashPin(pin);
    await db.insert(players).values({ id, name, pin: hashedPin, createdAt: Date.now() });

    const token = await signToken({ playerId: id, isAdmin: false });
    return c.json({ token, playerId: id, name });
  });

  router.get("/me", authMiddleware, async (c) => {
    const playerId = c.get("playerId");
    const player = await db
      .select({ id: players.id, name: players.name })
      .from(players)
      .where(eq(players.id, playerId))
      .limit(1);

    if (player.length === 0) {
      return c.json({ error: "Player not found" }, 401);
    }

    return c.json({ playerId: player[0].id, name: player[0].name });
  });

  return router;
}

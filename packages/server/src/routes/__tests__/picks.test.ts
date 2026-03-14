import { describe, expect, it, beforeEach } from "vitest";
import { createId } from "@paralleldrive/cuid2";
import { createTestApp, createPlayerToken, seedCategories } from "../../test-utils";
import { players, gameConfig } from "../../db/schema";
import { eq } from "drizzle-orm";

describe("Picks routes", () => {
  let app: ReturnType<typeof createTestApp>["app"];
  let db: ReturnType<typeof createTestApp>["db"];
  let playerId: string;
  let token: string;

  beforeEach(async () => {
    const ctx = createTestApp();
    app = ctx.app;
    db = ctx.db;

    // Create a player
    playerId = createId();
    await db.insert(players).values({
      id: playerId,
      name: "TestPlayer",
      pin: "hashed",
      createdAt: Date.now(),
    });

    token = await createPlayerToken(playerId);
  });

  describe("POST /api/picks", () => {
    it("submits a valid pick and returns 200", async () => {
      const { categoryId, nominationId } = await seedCategories(db);

      const res = await app.request("/api/picks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryId, nominationId }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pick).toBeDefined();
      expect(body.pick.playerId).toBe(playerId);
      expect(body.pick.categoryId).toBe(categoryId);
      expect(body.pick.nominationId).toBe(nominationId);
    });

    it("upserts pick for same category (overwrites)", async () => {
      const { categoryId, nominationId, nominationId2 } = await seedCategories(db);

      // First pick
      await app.request("/api/picks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryId, nominationId }),
      });

      // Second pick for same category
      const res = await app.request("/api/picks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryId, nominationId: nominationId2 }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pick.nominationId).toBe(nominationId2);
    });

    it("returns 403 when picks are locked (picksLockAt in the past)", async () => {
      const { categoryId, nominationId } = await seedCategories(db);

      // Set picksLockAt to the past
      await db
        .update(gameConfig)
        .set({ picksLockAt: Date.now() - 10000 })
        .where(eq(gameConfig.id, 1));

      const res = await app.request("/api/picks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryId, nominationId }),
      });

      expect(res.status).toBe(403);
    });

    it("returns 403 when game is completed", async () => {
      const { categoryId, nominationId } = await seedCategories(db);

      await db
        .update(gameConfig)
        .set({ completedAt: Date.now() - 1000 })
        .where(eq(gameConfig.id, 1));

      const res = await app.request("/api/picks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryId, nominationId }),
      });

      expect(res.status).toBe(403);
    });

    it("returns 400 when nomination does not belong to the specified category", async () => {
      const { categoryId, otherNominationId } = await seedCategories(db);

      const res = await app.request("/api/picks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryId, nominationId: otherNominationId }),
      });

      expect(res.status).toBe(400);
    });

    it("returns 401 for unauthenticated request", async () => {
      const { categoryId, nominationId } = await seedCategories(db);

      const res = await app.request("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, nominationId }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/picks", () => {
    it("returns all picks for the authenticated player", async () => {
      const { categoryId, nominationId } = await seedCategories(db);

      await app.request("/api/picks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryId, nominationId }),
      });

      const res = await app.request("/api/picks", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.picks)).toBe(true);
      expect(body.picks).toHaveLength(1);
      expect(body.picks[0].categoryId).toBe(categoryId);
    });

    it("returns 401 for unauthenticated request", async () => {
      const res = await app.request("/api/picks", { method: "GET" });
      expect(res.status).toBe(401);
    });
  });
});

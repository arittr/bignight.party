import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { createTestApp, createPlayerToken } from "../../test-utils";
import { categories, nominations, picks, players, gameConfig } from "../../db/schema";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import type { Db } from "../../db/connection";

let app: ReturnType<typeof createTestApp>["app"];
let db: ReturnType<typeof createTestApp>["db"];
let adminToken: string;

async function setupAdmin() {
  adminToken = await createPlayerToken("admin", true);
}

async function insertCategory(
  database: Db,
  name: string,
  order: number,
  nominationTitles: string[],
) {
  const catId = createId();
  await database.insert(categories).values({
    id: catId,
    name,
    order,
    points: 1,
    winnerId: null,
    isRevealed: false,
    createdAt: Date.now(),
  });

  const nomIds: string[] = [];
  for (const title of nominationTitles) {
    const nomId = createId();
    nomIds.push(nomId);
    await database.insert(nominations).values({
      id: nomId,
      categoryId: catId,
      title,
      subtitle: "",
      imageUrl: null,
      createdAt: Date.now(),
    });
  }
  return { catId, nomIds };
}

describe("Admin Routes", () => {
  beforeEach(async () => {
    const ctx = createTestApp();
    app = ctx.app;
    db = ctx.db;
    await setupAdmin();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ---- Login ----
  describe("POST /api/admin/login", () => {
    it("returns token with correct ADMIN_PIN", async () => {
      vi.stubEnv("ADMIN_PIN", "secret123");
      const res = await app.request("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: "secret123" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.token).toBeDefined();
    });

    it("returns 401 with wrong PIN", async () => {
      vi.stubEnv("ADMIN_PIN", "secret123");
      const res = await app.request("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: "wrong" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 401 when ADMIN_PIN is not set", async () => {
      delete process.env.ADMIN_PIN;
      const res = await app.request("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: "anything" }),
      });
      expect(res.status).toBe(401);
    });
  });

  // ---- Mark Winner ----
  describe("POST /api/admin/mark-winner", () => {
    it("marks a nomination as winner and reveals category", async () => {
      const { catId, nomIds } = await insertCategory(db, "Best Picture", 0, [
        "Film A",
        "Film B",
      ]);

      const res = await app.request("/api/admin/mark-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ categoryId: catId, nominationId: nomIds[0] }),
      });
      expect(res.status).toBe(200);

      const cats = await db.select().from(categories).where(eq(categories.id, catId));
      expect(cats[0].winnerId).toBe(nomIds[0]);
      expect(cats[0].isRevealed).toBe(true);
    });

    it("sets completedAt when all categories are revealed", async () => {
      const cat1 = await insertCategory(db, "Best Picture", 0, ["Film A", "Film B"]);
      const cat2 = await insertCategory(db, "Best Director", 1, ["Dir A", "Dir B"]);

      // Mark first category
      await app.request("/api/admin/mark-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ categoryId: cat1.catId, nominationId: cat1.nomIds[0] }),
      });

      // Mark second (last) category
      await app.request("/api/admin/mark-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ categoryId: cat2.catId, nominationId: cat2.nomIds[0] }),
      });

      const config = await db.select().from(gameConfig).where(eq(gameConfig.id, 1));
      expect(config[0].completedAt).toBeDefined();
      expect(config[0].completedAt).not.toBeNull();
    });

    it("returns 403 for non-admin", async () => {
      const playerToken = await createPlayerToken("player1", false);
      const res = await app.request("/api/admin/mark-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${playerToken}`,
        },
        body: JSON.stringify({ categoryId: "cat1", nominationId: "nom1" }),
      });
      expect(res.status).toBe(403);
    });

    it("returns 404 when nomination does not belong to category", async () => {
      const cat1 = await insertCategory(db, "Best Picture", 0, ["Film A"]);
      const cat2 = await insertCategory(db, "Best Director", 1, ["Dir A"]);

      const res = await app.request("/api/admin/mark-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ categoryId: cat1.catId, nominationId: cat2.nomIds[0] }),
      });
      expect(res.status).toBe(404);
    });
  });

  // ---- Clear Winner ----
  describe("POST /api/admin/clear-winner", () => {
    it("clears winner and unreveals category", async () => {
      const { catId, nomIds } = await insertCategory(db, "Best Picture", 0, [
        "Film A",
        "Film B",
      ]);

      // First mark a winner
      await db
        .update(categories)
        .set({ winnerId: nomIds[0], isRevealed: true })
        .where(eq(categories.id, catId));

      const res = await app.request("/api/admin/clear-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ categoryId: catId }),
      });
      expect(res.status).toBe(200);

      const cats = await db.select().from(categories).where(eq(categories.id, catId));
      expect(cats[0].winnerId).toBeNull();
      expect(cats[0].isRevealed).toBe(false);
    });
  });

  // ---- Lock ----
  describe("PUT /api/admin/lock", () => {
    it("sets picksLockAt", async () => {
      const lockTime = Date.now() + 60000;
      const res = await app.request("/api/admin/lock", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ picksLockAt: lockTime }),
      });
      expect(res.status).toBe(200);

      const config = await db.select().from(gameConfig).where(eq(gameConfig.id, 1));
      expect(config[0].picksLockAt).toBe(lockTime);
    });

    it("clears picksLockAt with null", async () => {
      // First set a lock time
      await db
        .update(gameConfig)
        .set({ picksLockAt: Date.now() + 60000 })
        .where(eq(gameConfig.id, 1));

      const res = await app.request("/api/admin/lock", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ picksLockAt: null }),
      });
      expect(res.status).toBe(200);

      const config = await db.select().from(gameConfig).where(eq(gameConfig.id, 1));
      expect(config[0].picksLockAt).toBeNull();
    });
  });

  // ---- Reset ----
  describe("POST /api/admin/reset", () => {
    it("resets all game data when confirm is true", async () => {
      // Set up some data
      await insertCategory(db, "Best Picture", 0, ["Film A"]);
      await db
        .update(gameConfig)
        .set({ picksLockAt: Date.now(), completedAt: Date.now() })
        .where(eq(gameConfig.id, 1));

      const res = await app.request("/api/admin/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ confirm: true }),
      });
      expect(res.status).toBe(200);

      const cats = await db.select().from(categories);
      expect(cats).toHaveLength(0);

      const noms = await db.select().from(nominations);
      expect(noms).toHaveLength(0);

      const config = await db.select().from(gameConfig).where(eq(gameConfig.id, 1));
      expect(config[0].picksLockAt).toBeNull();
      expect(config[0].completedAt).toBeNull();
    });

    it("rejects reset without confirm", async () => {
      const res = await app.request("/api/admin/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ confirm: false }),
      });
      expect(res.status).toBe(400);
    });

    it("rejects reset with no body", async () => {
      const res = await app.request("/api/admin/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  // ---- Import (unit test with direct DB insertion) ----
  describe("POST /api/admin/import", () => {
    it("returns 403 for non-admin", async () => {
      const playerToken = await createPlayerToken("player1", false);
      const res = await app.request("/api/admin/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${playerToken}`,
        },
        body: JSON.stringify({ url: "https://en.wikipedia.org/wiki/97th_Academy_Awards" }),
      });
      expect(res.status).toBe(403);
    });
  });

  // ---- Preview ----
  describe("POST /api/admin/preview", () => {
    it("returns 403 for non-admin", async () => {
      const playerToken = await createPlayerToken("player1", false);
      const res = await app.request("/api/admin/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${playerToken}`,
        },
        body: JSON.stringify({ url: "https://en.wikipedia.org/wiki/97th_Academy_Awards" }),
      });
      expect(res.status).toBe(403);
    });
  });
});

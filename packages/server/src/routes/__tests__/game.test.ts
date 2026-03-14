import { describe, expect, it, beforeEach } from "vitest";
import { createTestApp, seedCategories } from "../../test-utils";
import { gameConfig } from "../../db/schema";
import { eq } from "drizzle-orm";

describe("GET /api/game", () => {
  let app: ReturnType<typeof createTestApp>["app"];
  let db: ReturnType<typeof createTestApp>["db"];

  beforeEach(() => {
    const ctx = createTestApp();
    app = ctx.app;
    db = ctx.db;
  });

  it("returns game state with phase, config, and category count", async () => {
    const res = await app.request("/api/game");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.phase).toBeDefined();
    expect(body.config).toBeDefined();
    expect(typeof body.categoryCount).toBe("number");
  });

  it("returns setup phase when no categories exist", async () => {
    const res = await app.request("/api/game");
    const body = await res.json();
    expect(body.phase).toBe("setup");
    expect(body.categoryCount).toBe(0);
  });

  it("returns open phase when categories exist and no lock", async () => {
    await seedCategories(db);

    const res = await app.request("/api/game");
    const body = await res.json();
    expect(body.phase).toBe("open");
    expect(body.categoryCount).toBeGreaterThan(0);
  });

  it("returns open phase when categories exist and picksLockAt is in the future", async () => {
    await seedCategories(db);
    await db
      .update(gameConfig)
      .set({ picksLockAt: Date.now() + 100000 })
      .where(eq(gameConfig.id, 1));

    const res = await app.request("/api/game");
    const body = await res.json();
    expect(body.phase).toBe("open");
  });

  it("returns locked phase when picksLockAt has passed and game not completed", async () => {
    await seedCategories(db);
    await db
      .update(gameConfig)
      .set({ picksLockAt: Date.now() - 10000 })
      .where(eq(gameConfig.id, 1));

    const res = await app.request("/api/game");
    const body = await res.json();
    expect(body.phase).toBe("locked");
  });

  it("returns completed phase when completedAt is set", async () => {
    await seedCategories(db);
    await db
      .update(gameConfig)
      .set({ completedAt: Date.now() - 1000 })
      .where(eq(gameConfig.id, 1));

    const res = await app.request("/api/game");
    const body = await res.json();
    expect(body.phase).toBe("completed");
  });
});

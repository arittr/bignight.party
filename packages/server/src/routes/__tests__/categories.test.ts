import { describe, expect, it, beforeEach } from "vitest";
import { createTestApp, seedCategories } from "../../test-utils";

describe("GET /api/categories", () => {
  let app: ReturnType<typeof createTestApp>["app"];
  let db: ReturnType<typeof createTestApp>["db"];

  beforeEach(() => {
    const ctx = createTestApp();
    app = ctx.app;
    db = ctx.db;
  });

  it("returns empty array when no categories exist", async () => {
    const res = await app.request("/api/categories");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.categories).toEqual([]);
  });

  it("returns all categories with their nominations", async () => {
    await seedCategories(db);

    const res = await app.request("/api/categories");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.categories)).toBe(true);
    expect(body.categories.length).toBeGreaterThan(0);

    const category = body.categories[0];
    expect(category.id).toBeDefined();
    expect(category.name).toBeDefined();
    expect(Array.isArray(category.nominations)).toBe(true);
    expect(category.nominations.length).toBeGreaterThan(0);
  });

  it("returns categories ordered by the order field", async () => {
    await seedCategories(db);

    const res = await app.request("/api/categories");
    const body = await res.json();
    const orders = body.categories.map((c: { order: number }) => c.order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it("each nomination belongs to its parent category", async () => {
    await seedCategories(db);

    const res = await app.request("/api/categories");
    const body = await res.json();

    for (const category of body.categories) {
      for (const nomination of category.nominations) {
        expect(nomination.categoryId).toBe(category.id);
      }
    }
  });
});

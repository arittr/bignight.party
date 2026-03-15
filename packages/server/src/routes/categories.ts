import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { categories, nominations } from "../db/schema";
import type { Db } from "../db/connection";
import type { AppEnv } from "../env";

export function categoriesRoutes(db: Db) {
  const router = new Hono<AppEnv>();

  router.get("/", async (c) => {
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.order));

    const allNominations = await db.select().from(nominations);

    const nominationsByCategory = new Map<string, typeof allNominations>();
    for (const nomination of allNominations) {
      const list = nominationsByCategory.get(nomination.categoryId) ?? [];
      list.push(nomination);
      nominationsByCategory.set(nomination.categoryId, list);
    }

    const result = allCategories.map((category) => ({
      ...category,
      // Hide winnerId until the category is revealed — prevents players from inspecting the API
      winnerId: category.isRevealed ? category.winnerId : null,
      nominations: nominationsByCategory.get(category.id) ?? [],
    }));

    return c.json({ categories: result });
  });

  return router;
}

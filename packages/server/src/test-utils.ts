import { createTestDb } from "./db/connection";
import { createApp } from "./app";
import { signToken } from "./auth/token";
import { categories, nominations } from "./db/schema";
import { createId } from "@paralleldrive/cuid2";
import type { Db } from "./db/connection";

export function createTestApp() {
  const db = createTestDb();
  const app = createApp(db);
  return { app, db };
}

export async function createPlayerToken(playerId: string, isAdmin = false) {
  return signToken({ playerId, isAdmin });
}

export async function seedCategories(db: Db) {
  const categoryId = createId();
  const otherCategoryId = createId();
  const nominationId = createId();
  const nominationId2 = createId();
  const otherNominationId = createId();
  const now = Date.now();

  await db.insert(categories).values([
    { id: categoryId, name: "Best Picture", order: 1, createdAt: now },
    { id: otherCategoryId, name: "Best Director", order: 2, createdAt: now },
  ]);

  await db.insert(nominations).values([
    { id: nominationId, categoryId, title: "Oppenheimer", subtitle: "", createdAt: now },
    { id: nominationId2, categoryId, title: "Barbie", subtitle: "", createdAt: now },
    { id: otherNominationId, categoryId: otherCategoryId, title: "Christopher Nolan", subtitle: "", createdAt: now },
  ]);

  return { categoryId, otherCategoryId, nominationId, nominationId2, otherNominationId };
}

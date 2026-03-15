import { describe, expect, it, beforeEach } from "vitest";
import { createTestDb } from "../../db/connection";
import { categories, nominations, gameConfig } from "../../db/schema";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { markWinner, clearWinner, getGamePhase } from "../game";
import type { Db } from "../../db/connection";

function setupDb() {
  return createTestDb();
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

describe("markWinner", () => {
  let db: Db;

  beforeEach(() => {
    db = setupDb();
  });

  it("sets winnerId and isRevealed on category", async () => {
    const { catId, nomIds } = await insertCategory(db, "Best Picture", 0, ["Film A", "Film B"]);

    await markWinner(db, catId, nomIds[0]);

    const cats = await db.select().from(categories).where(eq(categories.id, catId));
    expect(cats[0].winnerId).toBe(nomIds[0]);
    expect(cats[0].isRevealed).toBe(true);
  });

  it("sets completedAt when all categories are revealed", async () => {
    const cat1 = await insertCategory(db, "Best Picture", 0, ["Film A"]);
    const cat2 = await insertCategory(db, "Best Director", 1, ["Dir A"]);

    await markWinner(db, cat1.catId, cat1.nomIds[0]);
    await markWinner(db, cat2.catId, cat2.nomIds[0]);

    const config = await db.select().from(gameConfig).where(eq(gameConfig.id, 1));
    expect(config[0].completedAt).not.toBeNull();
  });

  it("does not set completedAt when some categories remain unrevealed", async () => {
    const cat1 = await insertCategory(db, "Best Picture", 0, ["Film A"]);
    await insertCategory(db, "Best Director", 1, ["Dir A"]);

    await markWinner(db, cat1.catId, cat1.nomIds[0]);

    const config = await db.select().from(gameConfig).where(eq(gameConfig.id, 1));
    expect(config[0].completedAt).toBeNull();
  });

  it("throws when nomination does not belong to category", async () => {
    const cat1 = await insertCategory(db, "Best Picture", 0, ["Film A"]);
    const cat2 = await insertCategory(db, "Best Director", 1, ["Dir A"]);

    await expect(markWinner(db, cat1.catId, cat2.nomIds[0])).rejects.toThrow();
  });
});

describe("clearWinner", () => {
  let db: Db;

  beforeEach(() => {
    db = setupDb();
  });

  it("clears winnerId and isRevealed", async () => {
    const { catId, nomIds } = await insertCategory(db, "Best Picture", 0, ["Film A"]);
    await markWinner(db, catId, nomIds[0]);

    await clearWinner(db, catId);

    const cats = await db.select().from(categories).where(eq(categories.id, catId));
    expect(cats[0].winnerId).toBeNull();
    expect(cats[0].isRevealed).toBe(false);
  });
});

describe("getGamePhase", () => {
  it("returns 'setup' when no categories exist", () => {
    const phase = getGamePhase({ completedAt: null }, false, false);
    expect(phase).toBe("setup");
  });

  it("returns 'completed' when completedAt is set", () => {
    const phase = getGamePhase({ completedAt: Date.now() }, true, true);
    expect(phase).toBe("completed");
  });

  it("returns 'locked' when a category has been revealed", () => {
    const phase = getGamePhase({ completedAt: null }, true, true);
    expect(phase).toBe("locked");
  });

  it("returns 'open' when no categories are revealed", () => {
    const phase = getGamePhase({ completedAt: null }, true, false);
    expect(phase).toBe("open");
  });
});

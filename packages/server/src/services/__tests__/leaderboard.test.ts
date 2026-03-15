import { describe, expect, it, beforeEach } from "vitest";
import { createTestDb } from "../../db/connection";
import { categories, nominations, picks, players, gameConfig } from "../../db/schema";
import { createId } from "@paralleldrive/cuid2";
import { getLeaderboard } from "../leaderboard";
import type { Db } from "../../db/connection";

function setupDb() {
  return createTestDb();
}

/** Insert a category and its nominations, returning their IDs.
 *  Pass setWinnerToFirst=true to mark the first nomination as winner. */
async function insertCategory(
  db: Db,
  name: string,
  order: number,
  nominationTitles: string[],
  setWinnerToFirst = false,
) {
  const catId = createId();
  await db.insert(categories).values({
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
    await db.insert(nominations).values({
      id: nomId,
      categoryId: catId,
      title,
      subtitle: "",
      imageUrl: null,
      createdAt: Date.now(),
    });
  }

  if (setWinnerToFirst && nomIds.length > 0) {
    const { eq } = await import("drizzle-orm");
    await db
      .update(categories)
      .set({ winnerId: nomIds[0], isRevealed: true })
      .where(eq(categories.id, catId));
  }

  return { catId, nomIds };
}

async function insertPlayer(db: Db, name: string) {
  const id = createId();
  await db.insert(players).values({
    id,
    name,
    pin: "hashed",
    createdAt: Date.now(),
  });
  return id;
}

async function insertPick(
  db: Db,
  playerId: string,
  categoryId: string,
  nominationId: string,
) {
  await db.insert(picks).values({
    id: createId(),
    playerId,
    categoryId,
    nominationId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

describe("getLeaderboard", () => {
  let db: Db;

  beforeEach(() => {
    db = setupDb();
  });

  it("returns empty array when no players exist", async () => {
    const result = await getLeaderboard(db);
    expect(result).toEqual([]);
  });

  it("excludes players with incomplete picks", async () => {
    // Two categories, player only picks one
    const cat1 = await insertCategory(db, "Best Picture", 0, ["Film A", "Film B"], true);
    const cat2 = await insertCategory(db, "Best Director", 1, ["Dir A", "Dir B"], true);

    const playerId = await insertPlayer(db, "PartialPicker");
    // Only pick cat1
    await insertPick(db, playerId, cat1.catId, cat1.nomIds[0]);

    const result = await getLeaderboard(db);
    expect(result).toEqual([]);
  });

  it("returns correct scores for players with all picks", async () => {
    const cat1 = await insertCategory(db, "Best Picture", 0, ["Film A", "Film B"]);
    const cat2 = await insertCategory(db, "Best Director", 1, ["Dir A", "Dir B"]);

    // Set winners (first nomination in each)
    const { eq } = await import("drizzle-orm");
    await db
      .update(categories)
      .set({ winnerId: cat1.nomIds[0], isRevealed: true })
      .where(eq(categories.id, cat1.catId));
    await db
      .update(categories)
      .set({ winnerId: cat2.nomIds[0], isRevealed: true })
      .where(eq(categories.id, cat2.catId));

    const player1 = await insertPlayer(db, "Alice");
    const player2 = await insertPlayer(db, "Bob");

    // Alice picks both correct
    await insertPick(db, player1, cat1.catId, cat1.nomIds[0]);
    await insertPick(db, player1, cat2.catId, cat2.nomIds[0]);

    // Bob picks one correct, one wrong
    await insertPick(db, player2, cat1.catId, cat1.nomIds[0]);
    await insertPick(db, player2, cat2.catId, cat2.nomIds[1]);

    const result = await getLeaderboard(db);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Alice");
    expect(result[0].totalScore).toBe(2);
    expect(result[0].correctCount).toBe(2);
    expect(result[0].rank).toBe(1);
    expect(result[1].name).toBe("Bob");
    expect(result[1].totalScore).toBe(1);
    expect(result[1].correctCount).toBe(1);
    expect(result[1].rank).toBe(2);
  });

  it("handles ties correctly via shared scoring logic", async () => {
    const cat1 = await insertCategory(db, "Best Picture", 0, ["Film A", "Film B"]);

    const { eq } = await import("drizzle-orm");
    await db
      .update(categories)
      .set({ winnerId: cat1.nomIds[0], isRevealed: true })
      .where(eq(categories.id, cat1.catId));

    const player1 = await insertPlayer(db, "Alice");
    const player2 = await insertPlayer(db, "Bob");

    // Both pick correct
    await insertPick(db, player1, cat1.catId, cat1.nomIds[0]);
    await insertPick(db, player2, cat1.catId, cat1.nomIds[0]);

    const result = await getLeaderboard(db);
    expect(result).toHaveLength(2);
    // Same score + same correct count = same rank, alphabetical order
    expect(result[0].name).toBe("Alice");
    expect(result[1].name).toBe("Bob");
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(1);
  });
});

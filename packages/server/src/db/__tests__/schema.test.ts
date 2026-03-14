import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { afterEach, describe, expect, test } from "vitest";
import { createDb } from "../connection";
import * as schema from "../schema";
import {
  categories,
  gameConfig,
  nominations,
  picks,
  players,
} from "../schema";

const MIGRATIONS_DIR = resolve(
  fileURLToPath(import.meta.url),
  "../../../..",
  "drizzle",
);

function createTestDb() {
  const db = createDb(":memory:");
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  return db;
}

describe("schema exports", () => {
  test("all 5 table exports exist", () => {
    expect(schema.players).toBeDefined();
    expect(schema.categories).toBeDefined();
    expect(schema.nominations).toBeDefined();
    expect(schema.picks).toBeDefined();
    expect(schema.gameConfig).toBeDefined();
  });
});

describe("players table", () => {
  let db: ReturnType<typeof createTestDb>;

  afterEach(() => {
    db.$client.close();
  });

  test("inserts and retrieves a player", async () => {
    db = createTestDb();
    await db.insert(players).values({
      id: "player-1",
      name: "Alice",
      pin: "1234",
      createdAt: Date.now(),
    });

    const result = await db.select().from(players).where(eq(players.id, "player-1"));
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Alice");
    expect(result[0]?.pin).toBe("1234");
  });

  test("enforces unique name constraint", async () => {
    db = createTestDb();
    await db.insert(players).values({
      id: "player-1",
      name: "Bob",
      pin: "1111",
      createdAt: Date.now(),
    });

    await expect(
      db.insert(players).values({
        id: "player-2",
        name: "Bob",
        pin: "2222",
        createdAt: Date.now(),
      }),
    ).rejects.toThrow();
  });
});

describe("picks table", () => {
  let db: ReturnType<typeof createTestDb>;

  afterEach(() => {
    db.$client.close();
  });

  async function seedCategoryAndNomination(db: ReturnType<typeof createTestDb>) {
    await db.insert(categories).values({
      id: "cat-1",
      name: "Best Picture",
      order: 1,
      points: 1,
      isRevealed: false,
      createdAt: Date.now(),
    });
    await db.insert(nominations).values({
      id: "nom-1",
      categoryId: "cat-1",
      title: "Oppenheimer",
      subtitle: "Universal",
      imageUrl: null,
      createdAt: Date.now(),
    });
  }

  test("enforces one pick per player per category", async () => {
    db = createTestDb();
    await db.insert(players).values({
      id: "player-1",
      name: "Charlie",
      pin: "0000",
      createdAt: Date.now(),
    });
    await seedCategoryAndNomination(db);

    const now = Date.now();
    await db.insert(picks).values({
      id: "pick-1",
      playerId: "player-1",
      categoryId: "cat-1",
      nominationId: "nom-1",
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      db.insert(picks).values({
        id: "pick-2",
        playerId: "player-1",
        categoryId: "cat-1",
        nominationId: "nom-1",
        createdAt: now,
        updatedAt: now,
      }),
    ).rejects.toThrow();
  });
});

describe("game_config table", () => {
  let db: ReturnType<typeof createTestDb>;

  afterEach(() => {
    db.$client.close();
  });

  test("stores singleton game config row", async () => {
    db = createTestDb();
    await db.insert(gameConfig).values({
      id: 1,
      picksLockAt: null,
      completedAt: null,
    });

    const result = await db.select().from(gameConfig);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(1);
    expect(result[0]?.picksLockAt).toBeNull();
  });
});

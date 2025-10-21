/**
 * Pick Model Tests
 *
 * Tests for the Pick model using real test database.
 * Verifies unique constraints, upsert behavior, foreign keys, and query functions.
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as pickModel from "../pick";
import { testPrisma } from "tests/utils/prisma";
import { buildUser, buildEvent, buildGame, buildCategory, buildNomination } from "tests/factories";

describe("pickModel.create", () => {
  let testUserId: string;
  let testGameId: string;
  let testCategoryId: string;
  let testNominationId: string;

  beforeEach(async () => {
    // Create test data
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-p-1" }),
    });
    testUserId = user.id;

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-p-1" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-p-1", eventId: event.id }),
    });
    testGameId = game.id;

    const category = await testPrisma.category.create({
      data: buildCategory({ id: "category-p-1", eventId: event.id }),
    });
    testCategoryId = category.id;

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ id: "nomination-p-1", categoryId: category.id }),
    });
    testNominationId = nomination.id;
  });

  it("creates pick with valid data", async () => {
    const pick = await pickModel.create({
      game: { connect: { id: testGameId } },
      user: { connect: { id: testUserId } },
      category: { connect: { id: testCategoryId } },
      nomination: { connect: { id: testNominationId } },
    });

    expect(pick.id).toBeDefined();
    expect(pick.gameId).toBe(testGameId);
    expect(pick.userId).toBe(testUserId);
    expect(pick.categoryId).toBe(testCategoryId);
    expect(pick.nominationId).toBe(testNominationId);
  });

  it("enforces unique constraint on (gameId, userId, categoryId)", async () => {
    await pickModel.create({
      game: { connect: { id: testGameId } },
      user: { connect: { id: testUserId } },
      category: { connect: { id: testCategoryId } },
      nomination: { connect: { id: testNominationId } },
    });

    // Try to create duplicate pick (same game, user, category)
    await expect(
      pickModel.create({
        game: { connect: { id: testGameId } },
        user: { connect: { id: testUserId } },
        category: { connect: { id: testCategoryId } },
        nomination: { connect: { id: testNominationId } },
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on gameId", async () => {
    await expect(
      pickModel.create({
        game: { connect: { id: "invalid-game-id" } },
        user: { connect: { id: testUserId } },
        category: { connect: { id: testCategoryId } },
        nomination: { connect: { id: testNominationId } },
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on userId", async () => {
    await expect(
      pickModel.create({
        game: { connect: { id: testGameId } },
        user: { connect: { id: "invalid-user-id" } },
        category: { connect: { id: testCategoryId } },
        nomination: { connect: { id: testNominationId } },
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on categoryId", async () => {
    await expect(
      pickModel.create({
        game: { connect: { id: testGameId } },
        user: { connect: { id: testUserId } },
        category: { connect: { id: "invalid-category-id" } },
        nomination: { connect: { id: testNominationId } },
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on nominationId", async () => {
    await expect(
      pickModel.create({
        game: { connect: { id: testGameId } },
        user: { connect: { id: testUserId } },
        category: { connect: { id: testCategoryId } },
        nomination: { connect: { id: "invalid-nomination-id" } },
      })
    ).rejects.toThrow();
  });

  it("allows same user to pick different nominations in different categories", async () => {
    // Create second category and nomination
    const category2 = await testPrisma.category.create({
      data: buildCategory({ id: "category-p-1-2", eventId: "event-p-1", name: "Category 2" }),
    });

    const nomination2 = await testPrisma.nomination.create({
      data: buildNomination({ id: "nomination-p-1-2", categoryId: category2.id }),
    });

    // Create pick for first category
    await pickModel.create({
      game: { connect: { id: testGameId } },
      user: { connect: { id: testUserId } },
      category: { connect: { id: testCategoryId } },
      nomination: { connect: { id: testNominationId } },
    });

    // Should allow pick for second category
    const pick2 = await pickModel.create({
      game: { connect: { id: testGameId } },
      user: { connect: { id: testUserId } },
      category: { connect: { id: category2.id } },
      nomination: { connect: { id: nomination2.id } },
    });

    expect(pick2.categoryId).toBe(category2.id);
  });
});

describe("pickModel.upsert", () => {
  let testUserId: string;
  let testGameId: string;
  let testCategoryId: string;
  let testNomination1Id: string;
  let testNomination2Id: string;

  beforeEach(async () => {
    // Create test data
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-p-2" }),
    });
    testUserId = user.id;

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-p-2" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-p-2", eventId: event.id }),
    });
    testGameId = game.id;

    const category = await testPrisma.category.create({
      data: buildCategory({ id: "category-p-2", eventId: event.id }),
    });
    testCategoryId = category.id;

    // Create two nominations for same category
    const nomination1 = await testPrisma.nomination.create({
      data: buildNomination({
        id: "nomination-p-2-1",
        categoryId: category.id,
        nominationText: "Option 1",
      }),
    });
    testNomination1Id = nomination1.id;

    const nomination2 = await testPrisma.nomination.create({
      data: buildNomination({
        id: "nomination-p-2-2",
        categoryId: category.id,
        nominationText: "Option 2",
      }),
    });
    testNomination2Id = nomination2.id;
  });

  it("creates new pick when none exists", async () => {
    const pick = await pickModel.upsert({
      gameId: testGameId,
      userId: testUserId,
      categoryId: testCategoryId,
      nominationId: testNomination1Id,
    });

    expect(pick.id).toBeDefined();
    expect(pick.nominationId).toBe(testNomination1Id);
  });

  it("updates existing pick with new nomination", async () => {
    // Create initial pick
    const initialPick = await pickModel.upsert({
      gameId: testGameId,
      userId: testUserId,
      categoryId: testCategoryId,
      nominationId: testNomination1Id,
    });

    // Update to different nomination
    const updatedPick = await pickModel.upsert({
      gameId: testGameId,
      userId: testUserId,
      categoryId: testCategoryId,
      nominationId: testNomination2Id,
    });

    expect(updatedPick.id).toBe(initialPick.id); // Same pick ID
    expect(updatedPick.nominationId).toBe(testNomination2Id); // Updated nomination
  });

  it("includes category and nomination data", async () => {
    const pick = await pickModel.upsert({
      gameId: testGameId,
      userId: testUserId,
      categoryId: testCategoryId,
      nominationId: testNomination1Id,
    });

    expect(pick.category).toBeDefined();
    expect(pick.nomination).toBeDefined();
    expect(pick.category.id).toBe(testCategoryId);
    expect(pick.nomination.id).toBe(testNomination1Id);
  });

  it("does not create duplicate picks", async () => {
    // Create pick via upsert
    await pickModel.upsert({
      gameId: testGameId,
      userId: testUserId,
      categoryId: testCategoryId,
      nominationId: testNomination1Id,
    });

    // Upsert again with same data
    await pickModel.upsert({
      gameId: testGameId,
      userId: testUserId,
      categoryId: testCategoryId,
      nominationId: testNomination1Id,
    });

    // Verify only one pick exists
    const picks = await testPrisma.pick.findMany({
      where: {
        gameId: testGameId,
        userId: testUserId,
        categoryId: testCategoryId,
      },
    });

    expect(picks).toHaveLength(1);
  });
});

describe("pickModel.findById", () => {
  let testPickId: string;

  beforeEach(async () => {
    // Create full test data chain
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-p-3" }),
    });

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-p-3" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-p-3", eventId: event.id }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({ id: "category-p-3", eventId: event.id }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ id: "nomination-p-3", categoryId: category.id }),
    });

    const pick = await testPrisma.pick.create({
      data: {
        gameId: game.id,
        userId: user.id,
        categoryId: category.id,
        nominationId: nomination.id,
      },
    });
    testPickId = pick.id;
  });

  it("returns pick with all relations included", async () => {
    const pick = await pickModel.findById(testPickId);

    expect(pick).toBeDefined();
    expect(pick?.id).toBe(testPickId);
    expect(pick?.category).toBeDefined();
    expect(pick?.game).toBeDefined();
    expect(pick?.nomination).toBeDefined();
    expect(pick?.user).toBeDefined();
  });

  it("returns null for nonexistent pick", async () => {
    const pick = await pickModel.findById("nonexistent-pick-id");

    expect(pick).toBeNull();
  });
});

describe("pickModel.getPicksByGameAndUser", () => {
  let testUserId: string;
  let testGameId: string;

  beforeEach(async () => {
    // Create test data
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-p-4" }),
    });
    testUserId = user.id;

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-p-4" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-p-4", eventId: event.id }),
    });
    testGameId = game.id;

    // Create two categories with nominations
    const category1 = await testPrisma.category.create({
      data: buildCategory({ id: "category-p-4-1", eventId: event.id, name: "Category 1" }),
    });
    const category2 = await testPrisma.category.create({
      data: buildCategory({ id: "category-p-4-2", eventId: event.id, name: "Category 2" }),
    });

    const nomination1 = await testPrisma.nomination.create({
      data: buildNomination({ id: "nomination-p-4-1", categoryId: category1.id }),
    });
    const nomination2 = await testPrisma.nomination.create({
      data: buildNomination({ id: "nomination-p-4-2", categoryId: category2.id }),
    });

    // Create picks
    await testPrisma.pick.create({
      data: {
        gameId: game.id,
        userId: user.id,
        categoryId: category1.id,
        nominationId: nomination1.id,
      },
    });
    await testPrisma.pick.create({
      data: {
        gameId: game.id,
        userId: user.id,
        categoryId: category2.id,
        nominationId: nomination2.id,
      },
    });
  });

  it("returns all picks for user in game", async () => {
    const picks = await pickModel.getPicksByGameAndUser(testGameId, testUserId);

    expect(Array.isArray(picks)).toBe(true);
    expect(picks).toHaveLength(2);
  });

  it("includes category and nomination with work/person data", async () => {
    const picks = await pickModel.getPicksByGameAndUser(testGameId, testUserId);

    expect(picks[0].category).toBeDefined();
    expect(picks[0].nomination).toBeDefined();
    expect(picks[0].nomination.work).toBeDefined(); // Can be null but property exists
    expect(picks[0].nomination.person).toBeDefined(); // Can be null but property exists
  });

  it("orders by createdAt ascending", async () => {
    const picks = await pickModel.getPicksByGameAndUser(testGameId, testUserId);

    // Verify ordering (earlier picks first)
    expect(picks[0].createdAt.getTime()).toBeLessThanOrEqual(picks[1].createdAt.getTime());
  });

  it("returns empty array for user with no picks in game", async () => {
    const picks = await pickModel.getPicksByGameAndUser(testGameId, "nonexistent-user");

    expect(picks).toEqual([]);
  });

  it("returns empty array for game with no picks", async () => {
    const picks = await pickModel.getPicksByGameAndUser("nonexistent-game", testUserId);

    expect(picks).toEqual([]);
  });
});

describe("pickModel.getPicksCountByGameAndUser", () => {
  let testUserId: string;
  let testGameId: string;

  beforeEach(async () => {
    // Create test data
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-p-5" }),
    });
    testUserId = user.id;

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-p-5" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-p-5", eventId: event.id }),
    });
    testGameId = game.id;

    // Create category and nomination
    const category = await testPrisma.category.create({
      data: buildCategory({ id: "category-p-5", eventId: event.id }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ id: "nomination-p-5", categoryId: category.id }),
    });

    // Create pick
    await testPrisma.pick.create({
      data: {
        gameId: game.id,
        userId: user.id,
        categoryId: category.id,
        nominationId: nomination.id,
      },
    });
  });

  it("returns count of picks for user in game", async () => {
    const count = await pickModel.getPicksCountByGameAndUser(testGameId, testUserId);

    expect(count).toBe(1);
  });

  it("returns 0 for user with no picks in game", async () => {
    const count = await pickModel.getPicksCountByGameAndUser(testGameId, "nonexistent-user");

    expect(count).toBe(0);
  });

  it("returns 0 for game with no picks", async () => {
    const count = await pickModel.getPicksCountByGameAndUser("nonexistent-game", testUserId);

    expect(count).toBe(0);
  });
});

describe("pickModel.deleteById", () => {
  let testPickId: string;

  beforeEach(async () => {
    // Create test data
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-p-6" }),
    });

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-p-6" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-p-6", eventId: event.id }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({ id: "category-p-6", eventId: event.id }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ id: "nomination-p-6", categoryId: category.id }),
    });

    const pick = await testPrisma.pick.create({
      data: {
        gameId: game.id,
        userId: user.id,
        categoryId: category.id,
        nominationId: nomination.id,
      },
    });
    testPickId = pick.id;
  });

  it("deletes pick by id", async () => {
    await pickModel.deleteById(testPickId);

    const pick = await pickModel.findById(testPickId);
    expect(pick).toBeNull();
  });

  it("returns deleted pick data", async () => {
    const deleted = await pickModel.deleteById(testPickId);

    expect(deleted.id).toBe(testPickId);
  });

  it("throws when deleting nonexistent pick", async () => {
    await expect(pickModel.deleteById("nonexistent-pick")).rejects.toThrow();
  });
});

describe("pickModel.deleteByUserAndGame", () => {
  let testUserId: string;
  let testGameId: string;

  beforeEach(async () => {
    // Create test data
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-p-7" }),
    });
    testUserId = user.id;

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-p-7" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-p-7", eventId: event.id }),
    });
    testGameId = game.id;

    // Create two categories with picks
    const category1 = await testPrisma.category.create({
      data: buildCategory({ id: "category-p-7-1", eventId: event.id }),
    });
    const category2 = await testPrisma.category.create({
      data: buildCategory({ id: "category-p-7-2", eventId: event.id }),
    });

    const nomination1 = await testPrisma.nomination.create({
      data: buildNomination({ id: "nomination-p-7-1", categoryId: category1.id }),
    });
    const nomination2 = await testPrisma.nomination.create({
      data: buildNomination({ id: "nomination-p-7-2", categoryId: category2.id }),
    });

    await testPrisma.pick.create({
      data: {
        gameId: game.id,
        userId: user.id,
        categoryId: category1.id,
        nominationId: nomination1.id,
      },
    });
    await testPrisma.pick.create({
      data: {
        gameId: game.id,
        userId: user.id,
        categoryId: category2.id,
        nominationId: nomination2.id,
      },
    });
  });

  it("deletes all picks for user in game", async () => {
    const result = await pickModel.deleteByUserAndGame(testGameId, testUserId);

    expect(result.count).toBe(2);

    const picks = await pickModel.getPicksByGameAndUser(testGameId, testUserId);
    expect(picks).toHaveLength(0);
  });

  it("returns count of deleted picks", async () => {
    const result = await pickModel.deleteByUserAndGame(testGameId, testUserId);

    expect(result.count).toBe(2);
  });

  it("returns 0 when no picks exist", async () => {
    const result = await pickModel.deleteByUserAndGame("nonexistent-game", testUserId);

    expect(result.count).toBe(0);
  });
});

describe("pickModel cascading deletes", () => {
  it("deletes picks when game is deleted", async () => {
    // Create full test data
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-p-8" }),
    });

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-p-8" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-p-8", eventId: event.id }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({ id: "category-p-8", eventId: event.id }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ id: "nomination-p-8", categoryId: category.id }),
    });

    const pick = await testPrisma.pick.create({
      data: {
        gameId: game.id,
        userId: user.id,
        categoryId: category.id,
        nominationId: nomination.id,
      },
    });

    // Delete game (should cascade to picks)
    await testPrisma.game.delete({ where: { id: game.id } });

    // Verify pick was deleted
    const pickExists = await testPrisma.pick.findUnique({
      where: { id: pick.id },
    });
    expect(pickExists).toBeNull();
  });

  it("deletes picks when user is deleted", async () => {
    // Create full test data
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-p-9" }),
    });

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-p-9" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-p-9", eventId: event.id }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({ id: "category-p-9", eventId: event.id }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ id: "nomination-p-9", categoryId: category.id }),
    });

    const pick = await testPrisma.pick.create({
      data: {
        gameId: game.id,
        userId: user.id,
        categoryId: category.id,
        nominationId: nomination.id,
      },
    });

    // Delete user (should cascade to picks)
    await testPrisma.user.delete({ where: { id: user.id } });

    // Verify pick was deleted
    const pickExists = await testPrisma.pick.findUnique({
      where: { id: pick.id },
    });
    expect(pickExists).toBeNull();
  });

  it("deletes picks when category is deleted", async () => {
    // Create full test data
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-p-10" }),
    });

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-p-10" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-p-10", eventId: event.id }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({ id: "category-p-10", eventId: event.id }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ id: "nomination-p-10", categoryId: category.id }),
    });

    const pick = await testPrisma.pick.create({
      data: {
        gameId: game.id,
        userId: user.id,
        categoryId: category.id,
        nominationId: nomination.id,
      },
    });

    // Delete category (should cascade to picks)
    await testPrisma.category.delete({ where: { id: category.id } });

    // Verify pick was deleted
    const pickExists = await testPrisma.pick.findUnique({
      where: { id: pick.id },
    });
    expect(pickExists).toBeNull();
  });
});

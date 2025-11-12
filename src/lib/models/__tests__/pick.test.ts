/**
 * Pick Model Tests
 *
 * Tests for the Pick model using real test database.
 * Verifies unique constraints, upsert behavior, foreign keys, and query functions.
 */

import { buildCategory, buildEvent, buildGame, buildNomination, buildUser } from "tests/factories";
import { testPrisma } from "tests/utils/prisma";
import { beforeEach, describe, expect, it } from "vitest";
import * as pickModel from "../pick";

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
      data: buildGame({ eventId: event.id, id: "game-p-1" }),
    });
    testGameId = game.id;

    const category = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-p-1" }),
    });
    testCategoryId = category.id;

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nomination-p-1" }),
    });
    testNominationId = nomination.id;
  });

  it("creates pick with valid data", async () => {
    const pick = await pickModel.create({
      category: { connect: { id: testCategoryId } },
      game: { connect: { id: testGameId } },
      nomination: { connect: { id: testNominationId } },
      user: { connect: { id: testUserId } },
    });

    expect(pick.id).toBeDefined();
    expect(pick.gameId).toBe(testGameId);
    expect(pick.userId).toBe(testUserId);
    expect(pick.categoryId).toBe(testCategoryId);
    expect(pick.nominationId).toBe(testNominationId);
  });

  it("enforces unique constraint on (gameId, userId, categoryId)", async () => {
    await pickModel.create({
      category: { connect: { id: testCategoryId } },
      game: { connect: { id: testGameId } },
      nomination: { connect: { id: testNominationId } },
      user: { connect: { id: testUserId } },
    });

    // Try to create duplicate pick (same game, user, category)
    await expect(
      pickModel.create({
        category: { connect: { id: testCategoryId } },
        game: { connect: { id: testGameId } },
        nomination: { connect: { id: testNominationId } },
        user: { connect: { id: testUserId } },
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on gameId", async () => {
    await expect(
      pickModel.create({
        category: { connect: { id: testCategoryId } },
        game: { connect: { id: "invalid-game-id" } },
        nomination: { connect: { id: testNominationId } },
        user: { connect: { id: testUserId } },
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on userId", async () => {
    await expect(
      pickModel.create({
        category: { connect: { id: testCategoryId } },
        game: { connect: { id: testGameId } },
        nomination: { connect: { id: testNominationId } },
        user: { connect: { id: "invalid-user-id" } },
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on categoryId", async () => {
    await expect(
      pickModel.create({
        category: { connect: { id: "invalid-category-id" } },
        game: { connect: { id: testGameId } },
        nomination: { connect: { id: testNominationId } },
        user: { connect: { id: testUserId } },
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on nominationId", async () => {
    await expect(
      pickModel.create({
        category: { connect: { id: testCategoryId } },
        game: { connect: { id: testGameId } },
        nomination: { connect: { id: "invalid-nomination-id" } },
        user: { connect: { id: testUserId } },
      })
    ).rejects.toThrow();
  });

  it("allows same user to pick different nominations in different categories", async () => {
    // Create second category and nomination
    const category2 = await testPrisma.category.create({
      data: buildCategory({ eventId: "event-p-1", id: "category-p-1-2", name: "Category 2" }),
    });

    const nomination2 = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category2.id, id: "nomination-p-1-2" }),
    });

    // Create pick for first category
    await pickModel.create({
      category: { connect: { id: testCategoryId } },
      game: { connect: { id: testGameId } },
      nomination: { connect: { id: testNominationId } },
      user: { connect: { id: testUserId } },
    });

    // Should allow pick for second category
    const pick2 = await pickModel.create({
      category: { connect: { id: category2.id } },
      game: { connect: { id: testGameId } },
      nomination: { connect: { id: nomination2.id } },
      user: { connect: { id: testUserId } },
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
      data: buildGame({ eventId: event.id, id: "game-p-2" }),
    });
    testGameId = game.id;

    const category = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-p-2" }),
    });
    testCategoryId = category.id;

    // Create two nominations for same category
    const nomination1 = await testPrisma.nomination.create({
      data: buildNomination({
        categoryId: category.id,
        id: "nomination-p-2-1",
        nominationText: "Option 1",
      }),
    });
    testNomination1Id = nomination1.id;

    const nomination2 = await testPrisma.nomination.create({
      data: buildNomination({
        categoryId: category.id,
        id: "nomination-p-2-2",
        nominationText: "Option 2",
      }),
    });
    testNomination2Id = nomination2.id;
  });

  it("creates new pick when none exists", async () => {
    const pick = await pickModel.upsert({
      categoryId: testCategoryId,
      gameId: testGameId,
      nominationId: testNomination1Id,
      userId: testUserId,
    });

    expect(pick.id).toBeDefined();
    expect(pick.nominationId).toBe(testNomination1Id);
  });

  it("updates existing pick with new nomination", async () => {
    // Create initial pick
    const initialPick = await pickModel.upsert({
      categoryId: testCategoryId,
      gameId: testGameId,
      nominationId: testNomination1Id,
      userId: testUserId,
    });

    // Update to different nomination
    const updatedPick = await pickModel.upsert({
      categoryId: testCategoryId,
      gameId: testGameId,
      nominationId: testNomination2Id,
      userId: testUserId,
    });

    expect(updatedPick.id).toBe(initialPick.id); // Same pick ID
    expect(updatedPick.nominationId).toBe(testNomination2Id); // Updated nomination
  });

  it("includes category and nomination data", async () => {
    const pick = await pickModel.upsert({
      categoryId: testCategoryId,
      gameId: testGameId,
      nominationId: testNomination1Id,
      userId: testUserId,
    });

    expect(pick.category).toBeDefined();
    expect(pick.nomination).toBeDefined();
    expect(pick.category.id).toBe(testCategoryId);
    expect(pick.nomination.id).toBe(testNomination1Id);
  });

  it("does not create duplicate picks", async () => {
    // Create pick via upsert
    await pickModel.upsert({
      categoryId: testCategoryId,
      gameId: testGameId,
      nominationId: testNomination1Id,
      userId: testUserId,
    });

    // Upsert again with same data
    await pickModel.upsert({
      categoryId: testCategoryId,
      gameId: testGameId,
      nominationId: testNomination1Id,
      userId: testUserId,
    });

    // Verify only one pick exists
    const picks = await testPrisma.pick.findMany({
      where: {
        categoryId: testCategoryId,
        gameId: testGameId,
        userId: testUserId,
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
      data: buildGame({ eventId: event.id, id: "game-p-3" }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-p-3" }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nomination-p-3" }),
    });

    const pick = await testPrisma.pick.create({
      data: {
        categoryId: category.id,
        gameId: game.id,
        nominationId: nomination.id,
        userId: user.id,
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
      data: buildGame({ eventId: event.id, id: "game-p-4" }),
    });
    testGameId = game.id;

    // Create two categories with nominations
    const category1 = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-p-4-1", name: "Category 1" }),
    });
    const category2 = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-p-4-2", name: "Category 2" }),
    });

    const nomination1 = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category1.id, id: "nomination-p-4-1" }),
    });
    const nomination2 = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category2.id, id: "nomination-p-4-2" }),
    });

    // Create picks
    await testPrisma.pick.create({
      data: {
        categoryId: category1.id,
        gameId: game.id,
        nominationId: nomination1.id,
        userId: user.id,
      },
    });
    await testPrisma.pick.create({
      data: {
        categoryId: category2.id,
        gameId: game.id,
        nominationId: nomination2.id,
        userId: user.id,
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
      data: buildGame({ eventId: event.id, id: "game-p-5" }),
    });
    testGameId = game.id;

    // Create category and nomination
    const category = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-p-5" }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nomination-p-5" }),
    });

    // Create pick
    await testPrisma.pick.create({
      data: {
        categoryId: category.id,
        gameId: game.id,
        nominationId: nomination.id,
        userId: user.id,
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
      data: buildGame({ eventId: event.id, id: "game-p-6" }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-p-6" }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nomination-p-6" }),
    });

    const pick = await testPrisma.pick.create({
      data: {
        categoryId: category.id,
        gameId: game.id,
        nominationId: nomination.id,
        userId: user.id,
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
      data: buildGame({ eventId: event.id, id: "game-p-7" }),
    });
    testGameId = game.id;

    // Create two categories with picks
    const category1 = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-p-7-1" }),
    });
    const category2 = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-p-7-2" }),
    });

    const nomination1 = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category1.id, id: "nomination-p-7-1" }),
    });
    const nomination2 = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category2.id, id: "nomination-p-7-2" }),
    });

    await testPrisma.pick.create({
      data: {
        categoryId: category1.id,
        gameId: game.id,
        nominationId: nomination1.id,
        userId: user.id,
      },
    });
    await testPrisma.pick.create({
      data: {
        categoryId: category2.id,
        gameId: game.id,
        nominationId: nomination2.id,
        userId: user.id,
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
      data: buildGame({ eventId: event.id, id: "game-p-8" }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-p-8" }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nomination-p-8" }),
    });

    const pick = await testPrisma.pick.create({
      data: {
        categoryId: category.id,
        gameId: game.id,
        nominationId: nomination.id,
        userId: user.id,
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
      data: buildGame({ eventId: event.id, id: "game-p-9" }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-p-9" }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nomination-p-9" }),
    });

    const pick = await testPrisma.pick.create({
      data: {
        categoryId: category.id,
        gameId: game.id,
        nominationId: nomination.id,
        userId: user.id,
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
      data: buildGame({ eventId: event.id, id: "game-p-10" }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-p-10" }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nomination-p-10" }),
    });

    const pick = await testPrisma.pick.create({
      data: {
        categoryId: category.id,
        gameId: game.id,
        nominationId: nomination.id,
        userId: user.id,
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

describe("pickModel.getLeaderboard", () => {
  it("returns empty array for game with no revealed categories", async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-lb-1" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-lb-1" }),
    });

    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-lb-1" }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({
        eventId: event.id,
        id: "category-lb-1",
        isRevealed: false,
        points: 10,
      }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nomination-lb-1" }),
    });

    // User has pick but category not revealed
    await testPrisma.pick.create({
      data: {
        categoryId: category.id,
        gameId: game.id,
        nominationId: nomination.id,
        userId: user.id,
      },
    });

    const leaderboard = await pickModel.getLeaderboard(game.id);

    // User should still appear but with 0 score
    expect(leaderboard).toHaveLength(1);
    expect(leaderboard[0].totalScore).toBe(0);
    expect(leaderboard[0].correctCount).toBe(0);
  });

  it("calculates correct scores for revealed winners", async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-lb-2" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-lb-2" }),
    });

    const user = await testPrisma.user.create({
      data: buildUser({ email: "user@example.com", id: "user-lb-2", name: "Test User" }),
    });

    // Create two categories
    const category1 = await testPrisma.category.create({
      data: buildCategory({
        eventId: event.id,
        id: "category-lb-2-1",
        isRevealed: true,
        name: "Category 1",
        order: 1,
        points: 10,
      }),
    });

    const category2 = await testPrisma.category.create({
      data: buildCategory({
        eventId: event.id,
        id: "category-lb-2-2",
        isRevealed: true,
        name: "Category 2",
        order: 2,
        points: 5,
      }),
    });

    // Create nominations
    const nom1Winner = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category1.id, id: "nom-lb-2-1-winner" }),
    });

    const nom2Winner = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category2.id, id: "nom-lb-2-2-winner" }),
    });

    // Set winners
    await testPrisma.category.update({
      data: { winnerNominationId: nom1Winner.id },
      where: { id: category1.id },
    });

    await testPrisma.category.update({
      data: { winnerNominationId: nom2Winner.id },
      where: { id: category2.id },
    });

    // User picks both winners correctly
    await testPrisma.pick.create({
      data: {
        categoryId: category1.id,
        gameId: game.id,
        nominationId: nom1Winner.id,
        userId: user.id,
      },
    });

    await testPrisma.pick.create({
      data: {
        categoryId: category2.id,
        gameId: game.id,
        nominationId: nom2Winner.id,
        userId: user.id,
      },
    });

    const leaderboard = await pickModel.getLeaderboard(game.id);

    expect(leaderboard).toHaveLength(1);
    expect(leaderboard[0].userId).toBe(user.id);
    expect(leaderboard[0].totalScore).toBe(15); // 10 + 5
    expect(leaderboard[0].correctCount).toBe(2);
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[0].name).toBe("Test User");
    expect(leaderboard[0].email).toBe("user@example.com");
  });

  it("only includes users with complete picks", async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-lb-3" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-lb-3" }),
    });

    const user1 = await testPrisma.user.create({
      data: buildUser({
        email: "user-lb-3-1@example.com",
        id: "user-lb-3-1",
        name: "Complete User",
      }),
    });

    const user2 = await testPrisma.user.create({
      data: buildUser({
        email: "user-lb-3-2@example.com",
        id: "user-lb-3-2",
        name: "Incomplete User",
      }),
    });

    // Create two categories
    const category1 = await testPrisma.category.create({
      data: buildCategory({
        eventId: event.id,
        id: "category-lb-3-1",
        order: 1,
        points: 10,
      }),
    });

    const category2 = await testPrisma.category.create({
      data: buildCategory({
        eventId: event.id,
        id: "category-lb-3-2",
        order: 2,
        points: 5,
      }),
    });

    const nom1 = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category1.id, id: "nom-lb-3-1" }),
    });

    const nom2 = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category2.id, id: "nom-lb-3-2" }),
    });

    // User1 has picks for both categories
    await testPrisma.pick.create({
      data: {
        categoryId: category1.id,
        gameId: game.id,
        nominationId: nom1.id,
        userId: user1.id,
      },
    });

    await testPrisma.pick.create({
      data: {
        categoryId: category2.id,
        gameId: game.id,
        nominationId: nom2.id,
        userId: user1.id,
      },
    });

    // User2 only has pick for category1 (incomplete)
    await testPrisma.pick.create({
      data: {
        categoryId: category1.id,
        gameId: game.id,
        nominationId: nom1.id,
        userId: user2.id,
      },
    });

    const leaderboard = await pickModel.getLeaderboard(game.id);

    // Only user1 should be included
    expect(leaderboard).toHaveLength(1);
    expect(leaderboard[0].userId).toBe(user1.id);
  });

  it("sorts correctly by score DESC, correct count DESC, name ASC", async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-lb-4" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-lb-4" }),
    });

    // Create three users with different names for sorting
    const userAlice = await testPrisma.user.create({
      data: buildUser({ email: "alice-lb-4@example.com", id: "user-lb-4-alice", name: "Alice" }),
    });

    const userBob = await testPrisma.user.create({
      data: buildUser({ email: "bob-lb-4@example.com", id: "user-lb-4-bob", name: "Bob" }),
    });

    const userCharlie = await testPrisma.user.create({
      data: buildUser({
        email: "charlie-lb-4@example.com",
        id: "user-lb-4-charlie",
        name: "Charlie",
      }),
    });

    // Create one category
    const category = await testPrisma.category.create({
      data: buildCategory({
        eventId: event.id,
        id: "category-lb-4",
        isRevealed: true,
        order: 1,
        points: 10,
      }),
    });

    const nomWinner = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nom-lb-4-winner" }),
    });

    const nomLoser = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nom-lb-4-loser" }),
    });

    // Set winner
    await testPrisma.category.update({
      data: { winnerNominationId: nomWinner.id },
      where: { id: category.id },
    });

    // Bob picks correctly (highest score)
    await testPrisma.pick.create({
      data: {
        categoryId: category.id,
        gameId: game.id,
        nominationId: nomWinner.id,
        userId: userBob.id,
      },
    });

    // Alice picks incorrectly
    await testPrisma.pick.create({
      data: {
        categoryId: category.id,
        gameId: game.id,
        nominationId: nomLoser.id,
        userId: userAlice.id,
      },
    });

    // Charlie picks incorrectly
    await testPrisma.pick.create({
      data: {
        categoryId: category.id,
        gameId: game.id,
        nominationId: nomLoser.id,
        userId: userCharlie.id,
      },
    });

    const leaderboard = await pickModel.getLeaderboard(game.id);

    expect(leaderboard).toHaveLength(3);
    // Bob first (correct pick)
    expect(leaderboard[0].name).toBe("Bob");
    expect(leaderboard[0].totalScore).toBe(10);
    // Alice second (incorrect, but alphabetically before Charlie)
    expect(leaderboard[1].name).toBe("Alice");
    expect(leaderboard[1].totalScore).toBe(0);
    // Charlie third
    expect(leaderboard[2].name).toBe("Charlie");
    expect(leaderboard[2].totalScore).toBe(0);
  });

  it("assigns correct rank numbers including ties", async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-lb-5" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-lb-5" }),
    });

    // Create two categories
    const category1 = await testPrisma.category.create({
      data: buildCategory({
        eventId: event.id,
        id: "category-lb-5-1",
        isRevealed: true,
        order: 1,
        points: 10,
      }),
    });

    const category2 = await testPrisma.category.create({
      data: buildCategory({
        eventId: event.id,
        id: "category-lb-5-2",
        isRevealed: true,
        order: 2,
        points: 5,
      }),
    });

    const nom1Winner = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category1.id, id: "nom-lb-5-1-winner" }),
    });

    const nom1Loser = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category1.id, id: "nom-lb-5-1-loser" }),
    });

    const nom2Winner = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category2.id, id: "nom-lb-5-2-winner" }),
    });

    // Set winners
    await testPrisma.category.update({
      data: { winnerNominationId: nom1Winner.id },
      where: { id: category1.id },
    });

    await testPrisma.category.update({
      data: { winnerNominationId: nom2Winner.id },
      where: { id: category2.id },
    });

    // Create three users
    const user1 = await testPrisma.user.create({
      data: buildUser({ email: "user-lb-5-1@example.com", id: "user-lb-5-1", name: "User 1" }),
    });

    const user2 = await testPrisma.user.create({
      data: buildUser({ email: "user-lb-5-2@example.com", id: "user-lb-5-2", name: "User 2" }),
    });

    const user3 = await testPrisma.user.create({
      data: buildUser({ email: "user-lb-5-3@example.com", id: "user-lb-5-3", name: "User 3" }),
    });

    // User1: 2 correct (15 points, rank 1)
    await testPrisma.pick.createMany({
      data: [
        {
          categoryId: category1.id,
          gameId: game.id,
          nominationId: nom1Winner.id,
          userId: user1.id,
        },
        {
          categoryId: category2.id,
          gameId: game.id,
          nominationId: nom2Winner.id,
          userId: user1.id,
        },
      ],
    });

    // User2: 1 correct (10 points, rank 2)
    await testPrisma.pick.createMany({
      data: [
        {
          categoryId: category1.id,
          gameId: game.id,
          nominationId: nom1Winner.id,
          userId: user2.id,
        },
        {
          categoryId: category2.id,
          gameId: game.id,
          nominationId: nom1Loser.id, // Wrong for category 2
          userId: user2.id,
        },
      ],
    });

    // User3: 1 correct (10 points, rank 2 - tie with user2)
    await testPrisma.pick.createMany({
      data: [
        {
          categoryId: category1.id,
          gameId: game.id,
          nominationId: nom1Winner.id,
          userId: user3.id,
        },
        {
          categoryId: category2.id,
          gameId: game.id,
          nominationId: nom1Loser.id, // Wrong for category 2
          userId: user3.id,
        },
      ],
    });

    const leaderboard = await pickModel.getLeaderboard(game.id);

    expect(leaderboard).toHaveLength(3);
    // User1 rank 1
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[0].totalScore).toBe(15);
    // User2 and User3 both rank 2 (tied)
    expect(leaderboard[1].rank).toBe(2);
    expect(leaderboard[1].totalScore).toBe(10);
    expect(leaderboard[2].rank).toBe(2);
    expect(leaderboard[2].totalScore).toBe(10);
  });

  it("returns empty array for nonexistent game", async () => {
    const leaderboard = await pickModel.getLeaderboard("nonexistent-game");

    expect(leaderboard).toEqual([]);
  });

  it("uses user email as name when name is null", async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-lb-6" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-lb-6" }),
    });

    const user = await testPrisma.user.create({
      data: buildUser({ email: "test@example.com", id: "user-lb-6", name: null }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({
        eventId: event.id,
        id: "category-lb-6",
        order: 1,
      }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nom-lb-6" }),
    });

    await testPrisma.pick.create({
      data: {
        categoryId: category.id,
        gameId: game.id,
        nominationId: nomination.id,
        userId: user.id,
      },
    });

    const leaderboard = await pickModel.getLeaderboard(game.id);

    expect(leaderboard).toHaveLength(1);
    expect(leaderboard[0].name).toBe("test@example.com");
  });
});

describe("pickModel.getPickCountsForGame", () => {
  let testGameId: string;
  let testCategory1Id: string;
  let testCategory2Id: string;
  let testNomination1Id: string;
  let testNomination2Id: string;
  let testNomination3Id: string;

  beforeEach(async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-pc-1" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-pc-1" }),
    });
    testGameId = game.id;

    // Create two categories
    const category1 = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-pc-1", name: "Category 1", order: 1 }),
    });
    testCategory1Id = category1.id;

    const category2 = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-pc-2", name: "Category 2", order: 2 }),
    });
    testCategory2Id = category2.id;

    // Create nominations
    const nomination1 = await testPrisma.nomination.create({
      data: buildNomination({
        categoryId: category1.id,
        id: "nomination-pc-1",
        nominationText: "Option 1",
      }),
    });
    testNomination1Id = nomination1.id;

    const nomination2 = await testPrisma.nomination.create({
      data: buildNomination({
        categoryId: category1.id,
        id: "nomination-pc-2",
        nominationText: "Option 2",
      }),
    });
    testNomination2Id = nomination2.id;

    const nomination3 = await testPrisma.nomination.create({
      data: buildNomination({
        categoryId: category2.id,
        id: "nomination-pc-3",
        nominationText: "Option 3",
      }),
    });
    testNomination3Id = nomination3.id;

    // Create users and picks
    const user1 = await testPrisma.user.create({
      data: buildUser({ email: "user-pc-1@example.com", id: "user-pc-1" }),
    });
    const user2 = await testPrisma.user.create({
      data: buildUser({ email: "user-pc-2@example.com", id: "user-pc-2" }),
    });
    const user3 = await testPrisma.user.create({
      data: buildUser({ email: "user-pc-3@example.com", id: "user-pc-3" }),
    });

    // User1 picks nomination1 for category1, nomination3 for category2
    await testPrisma.pick.createMany({
      data: [
        {
          categoryId: category1.id,
          gameId: game.id,
          nominationId: nomination1.id,
          userId: user1.id,
        },
        {
          categoryId: category2.id,
          gameId: game.id,
          nominationId: nomination3.id,
          userId: user1.id,
        },
      ],
    });

    // User2 picks nomination1 for category1, nomination3 for category2
    await testPrisma.pick.createMany({
      data: [
        {
          categoryId: category1.id,
          gameId: game.id,
          nominationId: nomination1.id,
          userId: user2.id,
        },
        {
          categoryId: category2.id,
          gameId: game.id,
          nominationId: nomination3.id,
          userId: user2.id,
        },
      ],
    });

    // User3 picks nomination2 for category1, nomination3 for category2
    await testPrisma.pick.createMany({
      data: [
        {
          categoryId: category1.id,
          gameId: game.id,
          nominationId: nomination2.id,
          userId: user3.id,
        },
        {
          categoryId: category2.id,
          gameId: game.id,
          nominationId: nomination3.id,
          userId: user3.id,
        },
      ],
    });
  });

  it("returns correct pick counts aggregated by category and nomination", async () => {
    const pickCounts = await pickModel.getPickCountsForGame(testGameId);

    expect(pickCounts).toHaveLength(3);

    // Find counts for each nomination
    const nom1Count = pickCounts.find((pc) => pc.nominationId === testNomination1Id);
    const nom2Count = pickCounts.find((pc) => pc.nominationId === testNomination2Id);
    const nom3Count = pickCounts.find((pc) => pc.nominationId === testNomination3Id);

    // Verify counts
    expect(nom1Count).toBeDefined();
    expect(nom1Count?.count).toBe(2); // User1 and User2 picked nomination1
    expect(nom1Count?.categoryId).toBe(testCategory1Id);

    expect(nom2Count).toBeDefined();
    expect(nom2Count?.count).toBe(1); // Only User3 picked nomination2
    expect(nom2Count?.categoryId).toBe(testCategory1Id);

    expect(nom3Count).toBeDefined();
    expect(nom3Count?.count).toBe(3); // All three users picked nomination3
    expect(nom3Count?.categoryId).toBe(testCategory2Id);
  });

  it("returns empty array for game with no picks", async () => {
    const pickCounts = await pickModel.getPickCountsForGame("nonexistent-game");

    expect(pickCounts).toEqual([]);
  });

  it("includes categoryId, nominationId, and count in results", async () => {
    const pickCounts = await pickModel.getPickCountsForGame(testGameId);

    expect(pickCounts.length).toBeGreaterThan(0);

    for (const pickCount of pickCounts) {
      expect(pickCount).toHaveProperty("categoryId");
      expect(pickCount).toHaveProperty("nominationId");
      expect(pickCount).toHaveProperty("count");
      expect(typeof pickCount.categoryId).toBe("string");
      expect(typeof pickCount.nominationId).toBe("string");
      expect(typeof pickCount.count).toBe("number");
    }
  });
});

describe("pickModel.areAllCategoriesRevealed", () => {
  it("returns true when all categories are revealed", async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-acr-1" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-acr-1" }),
    });

    // Create three categories, all revealed
    await testPrisma.category.createMany({
      data: [
        buildCategory({
          eventId: event.id,
          id: "category-acr-1-1",
          isRevealed: true,
          name: "Category 1",
          order: 1,
        }),
        buildCategory({
          eventId: event.id,
          id: "category-acr-1-2",
          isRevealed: true,
          name: "Category 2",
          order: 2,
        }),
        buildCategory({
          eventId: event.id,
          id: "category-acr-1-3",
          isRevealed: true,
          name: "Category 3",
          order: 3,
        }),
      ],
    });

    const allRevealed = await pickModel.areAllCategoriesRevealed(game.id);

    expect(allRevealed).toBe(true);
  });

  it("returns false when any category is unrevealed", async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-acr-2" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-acr-2" }),
    });

    // Create three categories, one unrevealed
    await testPrisma.category.createMany({
      data: [
        buildCategory({
          eventId: event.id,
          id: "category-acr-2-1",
          isRevealed: true,
          name: "Category 1",
          order: 1,
        }),
        buildCategory({
          eventId: event.id,
          id: "category-acr-2-2",
          isRevealed: false, // This one is NOT revealed
          name: "Category 2",
          order: 2,
        }),
        buildCategory({
          eventId: event.id,
          id: "category-acr-2-3",
          isRevealed: true,
          name: "Category 3",
          order: 3,
        }),
      ],
    });

    const allRevealed = await pickModel.areAllCategoriesRevealed(game.id);

    expect(allRevealed).toBe(false);
  });

  it("returns false when no categories exist", async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-acr-3" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-acr-3" }),
    });

    // No categories created

    const allRevealed = await pickModel.areAllCategoriesRevealed(game.id);

    expect(allRevealed).toBe(false);
  });

  it("returns false for nonexistent game", async () => {
    const allRevealed = await pickModel.areAllCategoriesRevealed("nonexistent-game");

    expect(allRevealed).toBe(false);
  });

  it("returns false when all categories are unrevealed", async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-acr-4" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-acr-4" }),
    });

    // Create three categories, all unrevealed
    await testPrisma.category.createMany({
      data: [
        buildCategory({
          eventId: event.id,
          id: "category-acr-4-1",
          isRevealed: false,
          name: "Category 1",
          order: 1,
        }),
        buildCategory({
          eventId: event.id,
          id: "category-acr-4-2",
          isRevealed: false,
          name: "Category 2",
          order: 2,
        }),
        buildCategory({
          eventId: event.id,
          id: "category-acr-4-3",
          isRevealed: false,
          name: "Category 3",
          order: 3,
        }),
      ],
    });

    const allRevealed = await pickModel.areAllCategoriesRevealed(game.id);

    expect(allRevealed).toBe(false);
  });
});

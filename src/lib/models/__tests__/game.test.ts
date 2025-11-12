/**
 * Game Model Tests
 *
 * Tests for the Game model using real test database.
 * Verifies Prisma queries, unique constraints, foreign keys, and cascading deletes.
 */

import { buildCategory, buildEvent, buildGame, buildNomination, buildUser } from "tests/factories";
import { testPrisma } from "tests/utils/prisma";
import { beforeEach, describe, expect, it } from "vitest";
import * as gameModel from "../game";

describe("gameModel.create", () => {
  let testEventId: string;

  beforeEach(async () => {
    // Create test event
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-g-1" }),
    });
    testEventId = event.id;
  });

  it("creates game with valid data", async () => {
    const game = await gameModel.create({
      accessCode: "TESTCODE1",
      event: { connect: { id: testEventId } },
      name: "Test Game",
      picksLockAt: new Date("2025-03-02T19:00:00Z"),
      status: "OPEN",
    });

    expect(game.id).toBeDefined();
    expect(game.name).toBe("Test Game");
    expect(game.accessCode).toBe("TESTCODE1");
    expect(game.status).toBe("OPEN");
    expect(game.eventId).toBe(testEventId);
  });

  it("enforces unique constraint on accessCode", async () => {
    await gameModel.create({
      accessCode: "DUPLICATE",
      event: { connect: { id: testEventId } },
      name: "Game 1",
      status: "OPEN",
    });

    await expect(
      gameModel.create({
        accessCode: "DUPLICATE",
        event: { connect: { id: testEventId } },
        name: "Game 2",
        status: "OPEN",
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on eventId", async () => {
    await expect(
      gameModel.create({
        accessCode: "TESTCODE2",
        event: { connect: { id: "invalid-event-id" } },
        name: "Test Game",
        status: "OPEN",
      })
    ).rejects.toThrow();
  });
});

describe("gameModel.findById", () => {
  let testGameId: string;

  beforeEach(async () => {
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-g-2" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-g-2" }),
    });
    testGameId = game.id;
  });

  it("returns game with event and picks included", async () => {
    const game = await gameModel.findById(testGameId);

    expect(game).toBeDefined();
    expect(game?.id).toBe(testGameId);
    expect(game?.event).toBeDefined();
    expect(game?.event.id).toBe("event-g-2");
    expect(game?.picks).toBeDefined();
    expect(Array.isArray(game?.picks)).toBe(true);
  });

  it("returns null for nonexistent game", async () => {
    const game = await gameModel.findById("nonexistent-game-id");

    expect(game).toBeNull();
  });
});

describe("gameModel.findByAccessCode", () => {
  let testAccessCode: string;

  beforeEach(async () => {
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-g-3" }),
    });

    await testPrisma.game.create({
      data: buildGame({ accessCode: "FINDME123", eventId: event.id, id: "game-g-3" }),
    });
    testAccessCode = "FINDME123";
  });

  it("returns game for valid access code", async () => {
    const game = await gameModel.findByAccessCode(testAccessCode);

    expect(game).toBeDefined();
    expect(game?.accessCode).toBe(testAccessCode);
    expect(game?.event).toBeDefined();
    expect(game?.picks).toBeDefined();
  });

  it("returns null for invalid access code", async () => {
    const game = await gameModel.findByAccessCode("INVALID999");

    expect(game).toBeNull();
  });

  it("is case-sensitive", async () => {
    const game = await gameModel.findByAccessCode("findme123"); // lowercase

    expect(game).toBeNull();
  });
});

describe("gameModel.findByEventId", () => {
  let testEventId: string;

  beforeEach(async () => {
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-g-4" }),
    });
    testEventId = event.id;

    // Create multiple games for same event
    await testPrisma.game.create({
      data: buildGame({ accessCode: "CODE1", eventId: testEventId, id: "game-g-4-1" }),
    });
    await testPrisma.game.create({
      data: buildGame({ accessCode: "CODE2", eventId: testEventId, id: "game-g-4-2" }),
    });
  });

  it("returns all games for an event", async () => {
    const games = await gameModel.findByEventId(testEventId);

    expect(Array.isArray(games)).toBe(true);
    expect(games).toHaveLength(2);
    expect(games[0].eventId).toBe(testEventId);
    expect(games[1].eventId).toBe(testEventId);
  });

  it("includes event and picks data", async () => {
    const games = await gameModel.findByEventId(testEventId);

    expect(games[0].event).toBeDefined();
    expect(games[0].picks).toBeDefined();
  });

  it("returns empty array for event with no games", async () => {
    const games = await gameModel.findByEventId("nonexistent-event");

    expect(games).toEqual([]);
  });
});

describe("gameModel.findAll", () => {
  beforeEach(async () => {
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-g-5" }),
    });

    // Create games with different timestamps
    await testPrisma.game.create({
      data: {
        ...buildGame({ accessCode: "OLDER", eventId: event.id, id: "game-g-5-1" }),
        createdAt: new Date("2025-01-01T10:00:00Z"),
      },
    });
    await testPrisma.game.create({
      data: {
        ...buildGame({ accessCode: "NEWER", eventId: event.id, id: "game-g-5-2" }),
        createdAt: new Date("2025-01-02T10:00:00Z"),
      },
    });
  });

  it("returns all games", async () => {
    const games = await gameModel.findAll();

    expect(Array.isArray(games)).toBe(true);
    expect(games.length).toBeGreaterThanOrEqual(2);
  });

  it("orders by createdAt descending (newest first)", async () => {
    const games = await gameModel.findAll();

    const game1Index = games.findIndex((g) => g.id === "game-g-5-1");
    const game2Index = games.findIndex((g) => g.id === "game-g-5-2");

    expect(game2Index).toBeLessThan(game1Index); // newer game comes first
  });

  it("includes event and picks data", async () => {
    const games = await gameModel.findAll();

    expect(games[0].event).toBeDefined();
    expect(games[0].picks).toBeDefined();
  });
});

describe("gameModel.update", () => {
  let testGameId: string;

  beforeEach(async () => {
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-g-6" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-g-6", status: "SETUP" }),
    });
    testGameId = game.id;
  });

  it("updates game status", async () => {
    const updated = await gameModel.update(testGameId, { status: "OPEN" });

    expect(updated.status).toBe("OPEN");
  });

  it("updates game name", async () => {
    const updated = await gameModel.update(testGameId, { name: "Updated Name" });

    expect(updated.name).toBe("Updated Name");
  });

  it("updates picksLockAt", async () => {
    const newLockTime = new Date("2025-03-05T20:00:00Z");
    const updated = await gameModel.update(testGameId, { picksLockAt: newLockTime });

    expect(updated.picksLockAt?.getTime()).toBe(newLockTime.getTime());
  });

  it("throws when updating nonexistent game", async () => {
    await expect(gameModel.update("nonexistent-game", { status: "OPEN" })).rejects.toThrow();
  });
});

describe("gameModel.deleteById", () => {
  let testGameId: string;

  beforeEach(async () => {
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-g-7" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-g-7" }),
    });
    testGameId = game.id;
  });

  it("deletes game by id", async () => {
    await gameModel.deleteById(testGameId);

    const game = await gameModel.findById(testGameId);
    expect(game).toBeNull();
  });

  it("returns deleted game data", async () => {
    const deleted = await gameModel.deleteById(testGameId);

    expect(deleted.id).toBe(testGameId);
  });

  it("throws when deleting nonexistent game", async () => {
    await expect(gameModel.deleteById("nonexistent-game")).rejects.toThrow();
  });
});

describe("gameModel cascading deletes", () => {
  it("deletes all picks when game is deleted", async () => {
    // Create event, game, user, category, nomination
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-g-8" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-g-8" }),
    });

    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-g-8" }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({ eventId: event.id, id: "category-g-8" }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nomination-g-8" }),
    });

    // Create pick
    const pick = await testPrisma.pick.create({
      data: {
        categoryId: category.id,
        gameId: game.id,
        nominationId: nomination.id,
        userId: user.id,
      },
    });

    // Delete game (should cascade to picks)
    await gameModel.deleteById(game.id);

    // Verify pick was deleted
    const pickExists = await testPrisma.pick.findUnique({
      where: { id: pick.id },
    });
    expect(pickExists).toBeNull();
  });

  it("deletes all participants when game is deleted", async () => {
    // Create event, game, user
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-g-9" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-g-9" }),
    });

    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-g-9" }),
    });

    // Create participant
    const participant = await testPrisma.gameParticipant.create({
      data: {
        gameId: game.id,
        userId: user.id,
      },
    });

    // Delete game (should cascade to participants)
    await gameModel.deleteById(game.id);

    // Verify participant was deleted
    const participantExists = await testPrisma.gameParticipant.findUnique({
      where: { id: participant.id },
    });
    expect(participantExists).toBeNull();
  });

  it("deletes all games when event is deleted", async () => {
    // Create event and game
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-g-10" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-g-10" }),
    });

    // Delete event (should cascade to games)
    await testPrisma.event.delete({ where: { id: event.id } });

    // Verify game was deleted
    const gameExists = await testPrisma.game.findUnique({
      where: { id: game.id },
    });
    expect(gameExists).toBeNull();
  });
});

describe("gameModel GameStatus enum validation", () => {
  let testEventId: string;

  beforeEach(async () => {
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-g-11" }),
    });
    testEventId = event.id;
  });

  it("accepts SETUP status", async () => {
    const game = await gameModel.create({
      accessCode: "SETUP1",
      event: { connect: { id: testEventId } },
      name: "Setup Game",
      status: "SETUP",
    });

    expect(game.status).toBe("SETUP");
  });

  it("accepts OPEN status", async () => {
    const game = await gameModel.create({
      accessCode: "OPEN1",
      event: { connect: { id: testEventId } },
      name: "Open Game",
      status: "OPEN",
    });

    expect(game.status).toBe("OPEN");
  });

  it("accepts LIVE status", async () => {
    const game = await gameModel.create({
      accessCode: "LIVE1",
      event: { connect: { id: testEventId } },
      name: "Live Game",
      status: "LIVE",
    });

    expect(game.status).toBe("LIVE");
  });

  it("accepts COMPLETED status", async () => {
    const game = await gameModel.create({
      accessCode: "COMPLETED1",
      event: { connect: { id: testEventId } },
      name: "Completed Game",
      status: "COMPLETED",
    });

    expect(game.status).toBe("COMPLETED");
  });
});

describe("gameModel.completeGame", () => {
  let testGameId: string;

  beforeEach(async () => {
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-g-12" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ eventId: event.id, id: "game-g-12", status: "LIVE" }),
    });
    testGameId = game.id;
  });

  it("sets status to COMPLETED", async () => {
    const updatedGame = await gameModel.completeGame(testGameId);

    expect(updatedGame.status).toBe("COMPLETED");
  });

  it("sets completedAt timestamp", async () => {
    const beforeComplete = new Date();
    const updatedGame = await gameModel.completeGame(testGameId);
    const afterComplete = new Date();

    expect(updatedGame.completedAt).toBeDefined();
    expect(updatedGame.completedAt).not.toBeNull();

    // Verify timestamp is within reasonable range
    const completedAt = updatedGame.completedAt as Date;
    expect(completedAt.getTime()).toBeGreaterThanOrEqual(beforeComplete.getTime());
    expect(completedAt.getTime()).toBeLessThanOrEqual(afterComplete.getTime());
  });

  it("persists both status and completedAt to database", async () => {
    await gameModel.completeGame(testGameId);

    // Fetch from DB to verify persistence
    const game = await testPrisma.game.findUnique({
      where: { id: testGameId },
    });

    expect(game?.status).toBe("COMPLETED");
    expect(game?.completedAt).toBeDefined();
    expect(game?.completedAt).not.toBeNull();
  });

  it("throws error for nonexistent game", async () => {
    await expect(gameModel.completeGame("nonexistent-game")).rejects.toThrow();
  });
});

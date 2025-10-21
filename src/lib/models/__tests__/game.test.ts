/**
 * Game Model Tests
 *
 * Tests for the Game model using real test database.
 * Verifies Prisma queries, unique constraints, foreign keys, and cascading deletes.
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as gameModel from "../game";
import { testPrisma } from "tests/utils/prisma";
import {
  buildEvent,
  buildGame,
  buildUser,
  buildCategory,
  buildNomination,
  buildPick,
} from "tests/factories";

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
      event: { connect: { id: testEventId } },
      name: "Test Game",
      accessCode: "TESTCODE1",
      status: "OPEN",
      picksLockAt: new Date("2025-03-02T19:00:00Z"),
    });

    expect(game.id).toBeDefined();
    expect(game.name).toBe("Test Game");
    expect(game.accessCode).toBe("TESTCODE1");
    expect(game.status).toBe("OPEN");
    expect(game.eventId).toBe(testEventId);
  });

  it("enforces unique constraint on accessCode", async () => {
    await gameModel.create({
      event: { connect: { id: testEventId } },
      name: "Game 1",
      accessCode: "DUPLICATE",
      status: "OPEN",
    });

    await expect(
      gameModel.create({
        event: { connect: { id: testEventId } },
        name: "Game 2",
        accessCode: "DUPLICATE",
        status: "OPEN",
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on eventId", async () => {
    await expect(
      gameModel.create({
        event: { connect: { id: "invalid-event-id" } },
        name: "Test Game",
        accessCode: "TESTCODE2",
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
      data: buildGame({ id: "game-g-2", eventId: event.id }),
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
      data: buildGame({ id: "game-g-3", eventId: event.id, accessCode: "FINDME123" }),
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
      data: buildGame({ id: "game-g-4-1", eventId: testEventId, accessCode: "CODE1" }),
    });
    await testPrisma.game.create({
      data: buildGame({ id: "game-g-4-2", eventId: testEventId, accessCode: "CODE2" }),
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
        ...buildGame({ id: "game-g-5-1", eventId: event.id, accessCode: "OLDER" }),
        createdAt: new Date("2025-01-01T10:00:00Z"),
      },
    });
    await testPrisma.game.create({
      data: {
        ...buildGame({ id: "game-g-5-2", eventId: event.id, accessCode: "NEWER" }),
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
      data: buildGame({ id: "game-g-6", eventId: event.id, status: "SETUP" }),
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
      data: buildGame({ id: "game-g-7", eventId: event.id }),
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
      data: buildGame({ id: "game-g-8", eventId: event.id }),
    });

    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-g-8" }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({ id: "category-g-8", eventId: event.id }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ id: "nomination-g-8", categoryId: category.id }),
    });

    // Create pick
    const pick = await testPrisma.pick.create({
      data: {
        gameId: game.id,
        userId: user.id,
        categoryId: category.id,
        nominationId: nomination.id,
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
      data: buildGame({ id: "game-g-9", eventId: event.id }),
    });

    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-g-9" }),
    });

    // Create participant
    const participant = await testPrisma.gameParticipant.create({
      data: {
        userId: user.id,
        gameId: game.id,
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
      data: buildGame({ id: "game-g-10", eventId: event.id }),
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
      event: { connect: { id: testEventId } },
      name: "Setup Game",
      accessCode: "SETUP1",
      status: "SETUP",
    });

    expect(game.status).toBe("SETUP");
  });

  it("accepts OPEN status", async () => {
    const game = await gameModel.create({
      event: { connect: { id: testEventId } },
      name: "Open Game",
      accessCode: "OPEN1",
      status: "OPEN",
    });

    expect(game.status).toBe("OPEN");
  });

  it("accepts LIVE status", async () => {
    const game = await gameModel.create({
      event: { connect: { id: testEventId } },
      name: "Live Game",
      accessCode: "LIVE1",
      status: "LIVE",
    });

    expect(game.status).toBe("LIVE");
  });

  it("accepts COMPLETED status", async () => {
    const game = await gameModel.create({
      event: { connect: { id: testEventId } },
      name: "Completed Game",
      accessCode: "COMPLETED1",
      status: "COMPLETED",
    });

    expect(game.status).toBe("COMPLETED");
  });
});

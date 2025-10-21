/**
 * GameParticipant Model Tests
 *
 * Tests for the GameParticipant model using real test database.
 * Verifies Prisma queries, unique constraints, foreign keys, and referential integrity.
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as gameParticipantModel from "../game-participant";
import { testPrisma } from "tests/utils/prisma";
import { buildUser, buildEvent, buildGame } from "tests/factories";

describe("gameParticipantModel.create", () => {
  let testUserId: string;
  let testGameId: string;

  beforeEach(async () => {
    // Create test user and game in database
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-gp-1" }),
    });
    testUserId = user.id;

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-gp-1" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-gp-1", eventId: event.id }),
    });
    testGameId = game.id;
  });

  it("creates participant with valid data", async () => {
    const participant = await gameParticipantModel.create({
      userId: testUserId,
      gameId: testGameId,
    });

    expect(participant.id).toBeDefined();
    expect(participant.userId).toBe(testUserId);
    expect(participant.gameId).toBe(testGameId);
    expect(participant.joinedAt).toBeInstanceOf(Date);
  });

  it("enforces unique constraint on (userId, gameId)", async () => {
    await gameParticipantModel.create({
      userId: testUserId,
      gameId: testGameId,
    });

    await expect(
      gameParticipantModel.create({
        userId: testUserId,
        gameId: testGameId,
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on userId", async () => {
    await expect(
      gameParticipantModel.create({
        userId: "invalid-user-id",
        gameId: testGameId,
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on gameId", async () => {
    await expect(
      gameParticipantModel.create({
        userId: testUserId,
        gameId: "invalid-game-id",
      })
    ).rejects.toThrow();
  });
});

describe("gameParticipantModel.findByUserId", () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-gp-2" }),
    });
    testUserId = user.id;

    // Create event
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-gp-2" }),
    });

    // Create two games
    const game1 = await testPrisma.game.create({
      data: buildGame({
        id: "game-gp-2-1",
        eventId: event.id,
        name: "Game 1",
        accessCode: "GP2CODE1",
      }),
    });
    const game2 = await testPrisma.game.create({
      data: buildGame({
        id: "game-gp-2-2",
        eventId: event.id,
        name: "Game 2",
        accessCode: "GP2CODE2",
      }),
    });

    // Create participants with different join times
    await testPrisma.gameParticipant.create({
      data: {
        userId: testUserId,
        gameId: game1.id,
        joinedAt: new Date("2025-01-01T10:00:00Z"),
      },
    });
    await testPrisma.gameParticipant.create({
      data: {
        userId: testUserId,
        gameId: game2.id,
        joinedAt: new Date("2025-01-02T10:00:00Z"),
      },
    });
  });

  it("returns all games for user with event includes", async () => {
    const participants = await gameParticipantModel.findByUserId(testUserId);

    expect(Array.isArray(participants)).toBe(true);
    expect(participants).toHaveLength(2);
    expect(participants[0].game).toBeDefined();
    expect(participants[0].game.event).toBeDefined();
    expect(participants[1].game).toBeDefined();
    expect(participants[1].game.event).toBeDefined();
  });

  it("orders by joinedAt descending (most recent first)", async () => {
    const participants = await gameParticipantModel.findByUserId(testUserId);

    expect(participants[0].joinedAt.getTime()).toBeGreaterThan(participants[1].joinedAt.getTime());
    expect(participants[0].game.name).toBe("Game 2");
    expect(participants[1].game.name).toBe("Game 1");
  });

  it("returns empty array for user with no games", async () => {
    const participants = await gameParticipantModel.findByUserId("nonexistent-user");

    expect(participants).toEqual([]);
  });
});

describe("gameParticipantModel.findByGameId", () => {
  let testGameId: string;

  beforeEach(async () => {
    // Create event and game
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-gp-3" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-gp-3", eventId: event.id }),
    });
    testGameId = game.id;

    // Create two users
    const user1 = await testPrisma.user.create({
      data: buildUser({ id: "user-gp-3-1", email: "user1@example.com" }),
    });
    const user2 = await testPrisma.user.create({
      data: buildUser({ id: "user-gp-3-2", email: "user2@example.com" }),
    });

    // Create participants with different join times
    await testPrisma.gameParticipant.create({
      data: {
        userId: user1.id,
        gameId: testGameId,
        joinedAt: new Date("2025-01-01T10:00:00Z"),
      },
    });
    await testPrisma.gameParticipant.create({
      data: {
        userId: user2.id,
        gameId: testGameId,
        joinedAt: new Date("2025-01-02T10:00:00Z"),
      },
    });
  });

  it("returns all participants with user data", async () => {
    const participants = await gameParticipantModel.findByGameId(testGameId);

    expect(Array.isArray(participants)).toBe(true);
    expect(participants).toHaveLength(2);
    expect(participants[0].user).toBeDefined();
    expect(participants[1].user).toBeDefined();
  });

  it("orders by joinedAt ascending (earliest first)", async () => {
    const participants = await gameParticipantModel.findByGameId(testGameId);

    expect(participants[0].joinedAt.getTime()).toBeLessThan(participants[1].joinedAt.getTime());
    expect(participants[0].user.email).toBe("user1@example.com");
    expect(participants[1].user.email).toBe("user2@example.com");
  });

  it("returns empty array for game with no participants", async () => {
    const participants = await gameParticipantModel.findByGameId("nonexistent-game");

    expect(participants).toEqual([]);
  });
});

describe("gameParticipantModel.exists", () => {
  let testUserId: string;
  let testGameId: string;

  beforeEach(async () => {
    // Create test user and game
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-gp-4" }),
    });
    testUserId = user.id;

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-gp-4" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-gp-4", eventId: event.id }),
    });
    testGameId = game.id;
  });

  it("returns true when participant exists", async () => {
    await gameParticipantModel.create({
      userId: testUserId,
      gameId: testGameId,
    });

    const result = await gameParticipantModel.exists(testUserId, testGameId);
    expect(result).toBe(true);
  });

  it("returns false when participant does not exist", async () => {
    const result = await gameParticipantModel.exists(testUserId, testGameId);
    expect(result).toBe(false);
  });

  it("returns false for invalid userId", async () => {
    await gameParticipantModel.create({
      userId: testUserId,
      gameId: testGameId,
    });

    const result = await gameParticipantModel.exists("invalid-user", testGameId);
    expect(result).toBe(false);
  });

  it("returns false for invalid gameId", async () => {
    await gameParticipantModel.create({
      userId: testUserId,
      gameId: testGameId,
    });

    const result = await gameParticipantModel.exists(testUserId, "invalid-game");
    expect(result).toBe(false);
  });
});

describe("gameParticipantModel.deleteByUserAndGame", () => {
  let testUserId: string;
  let testGameId: string;

  beforeEach(async () => {
    // Create test user and game
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-gp-5" }),
    });
    testUserId = user.id;

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-gp-5" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-gp-5", eventId: event.id }),
    });
    testGameId = game.id;
  });

  it("removes membership", async () => {
    await gameParticipantModel.create({
      userId: testUserId,
      gameId: testGameId,
    });

    await gameParticipantModel.deleteByUserAndGame(testUserId, testGameId);

    const exists = await gameParticipantModel.exists(testUserId, testGameId);
    expect(exists).toBe(false);
  });

  it("throws when membership does not exist", async () => {
    await expect(
      gameParticipantModel.deleteByUserAndGame(testUserId, testGameId)
    ).rejects.toThrow();
  });

  it("returns deleted participant data", async () => {
    await gameParticipantModel.create({
      userId: testUserId,
      gameId: testGameId,
    });

    const deleted = await gameParticipantModel.deleteByUserAndGame(testUserId, testGameId);

    expect(deleted.userId).toBe(testUserId);
    expect(deleted.gameId).toBe(testGameId);
  });
});

describe("gameParticipantModel cascading deletes", () => {
  it("deletes participants when user is deleted", async () => {
    // Create user, event, game
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-gp-6" }),
    });

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-gp-6" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-gp-6", eventId: event.id }),
    });

    // Create participant
    await gameParticipantModel.create({
      userId: user.id,
      gameId: game.id,
    });

    // Delete user (should cascade to participant)
    await testPrisma.user.delete({ where: { id: user.id } });

    // Verify participant was deleted
    const exists = await gameParticipantModel.exists(user.id, game.id);
    expect(exists).toBe(false);
  });

  it("deletes participants when game is deleted", async () => {
    // Create user, event, game
    const user = await testPrisma.user.create({
      data: buildUser({ id: "user-gp-7" }),
    });

    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-gp-7" }),
    });

    const game = await testPrisma.game.create({
      data: buildGame({ id: "game-gp-7", eventId: event.id }),
    });

    // Create participant
    await gameParticipantModel.create({
      userId: user.id,
      gameId: game.id,
    });

    // Delete game (should cascade to participant)
    await testPrisma.game.delete({ where: { id: game.id } });

    // Verify participant was deleted
    const exists = await gameParticipantModel.exists(user.id, game.id);
    expect(exists).toBe(false);
  });
});

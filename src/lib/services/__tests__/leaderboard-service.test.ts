/**
 * Leaderboard Service Tests
 *
 * Tests business logic in leaderboard-service with mocked model and WebSocket layers.
 * Focus: Score calculation, WebSocket broadcasting, error handling, current user marking.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as pickModel from "@/lib/models/pick";
import * as leaderboardService from "@/lib/services/leaderboard-service";
import * as websocketServer from "@/lib/websocket/server";
import type { LeaderboardPlayer } from "@/types/leaderboard";

// Mock all external dependencies
vi.mock("@/lib/models/pick");
vi.mock("@/lib/websocket/server");

describe("leaderboardService.calculateLeaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls pick model and returns structured leaderboard data", async () => {
    const mockPlayers: LeaderboardPlayer[] = [
      {
        correctCount: 3,
        email: "alice@example.com",
        image: null,
        isCurrentUser: false,
        name: "Alice",
        rank: 1,
        totalScore: 15,
        userId: "user-1",
      },
      {
        correctCount: 2,
        email: "bob@example.com",
        image: null,
        isCurrentUser: false,
        name: "Bob",
        rank: 2,
        totalScore: 10,
        userId: "user-2",
      },
    ];

    vi.mocked(pickModel.getLeaderboard).mockResolvedValue(mockPlayers);

    const result = await leaderboardService.calculateLeaderboard("game-1");

    expect(pickModel.getLeaderboard).toHaveBeenCalledWith("game-1");
    expect(result).toMatchObject({
      gameId: "game-1",
      players: mockPlayers,
    });
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("returns empty players array when no players have complete picks", async () => {
    vi.mocked(pickModel.getLeaderboard).mockResolvedValue([]);

    const result = await leaderboardService.calculateLeaderboard("game-1");

    expect(result.players).toEqual([]);
    expect(result.gameId).toBe("game-1");
  });

  it("propagates errors from pick model", async () => {
    vi.mocked(pickModel.getLeaderboard).mockRejectedValue(new Error("Database error"));

    await expect(leaderboardService.calculateLeaderboard("game-1")).rejects.toThrow(
      "Database error"
    );
  });
});

describe("leaderboardService.broadcastLeaderboardUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates leaderboard and emits WebSocket event with correct payload", async () => {
    const mockPlayers: LeaderboardPlayer[] = [
      {
        correctCount: 3,
        email: "alice@example.com",
        image: null,
        isCurrentUser: false,
        name: "Alice",
        rank: 1,
        totalScore: 15,
        userId: "user-1",
      },
    ];

    vi.mocked(pickModel.getLeaderboard).mockResolvedValue(mockPlayers);
    vi.mocked(websocketServer.emitLeaderboardUpdate).mockReturnValue(undefined);

    await leaderboardService.broadcastLeaderboardUpdate("game-1");

    expect(pickModel.getLeaderboard).toHaveBeenCalledWith("game-1");
    expect(websocketServer.emitLeaderboardUpdate).toHaveBeenCalledWith("game-1", {
      gameId: "game-1",
      players: mockPlayers,
      timestamp: expect.any(Number),
    });
  });

  it("does not throw when calculation fails (logs error instead)", async () => {
    vi.mocked(pickModel.getLeaderboard).mockRejectedValue(new Error("Database error"));

    // Should not throw - errors are logged but don't propagate
    await expect(leaderboardService.broadcastLeaderboardUpdate("game-1")).resolves.toBeUndefined();

    // WebSocket emit should not be called if calculation fails
    expect(websocketServer.emitLeaderboardUpdate).not.toHaveBeenCalled();
  });

  it("does not throw when WebSocket emit fails (logs error instead)", async () => {
    const mockPlayers: LeaderboardPlayer[] = [
      {
        correctCount: 1,
        email: "alice@example.com",
        image: null,
        isCurrentUser: false,
        name: "Alice",
        rank: 1,
        totalScore: 5,
        userId: "user-1",
      },
    ];

    vi.mocked(pickModel.getLeaderboard).mockResolvedValue(mockPlayers);
    vi.mocked(websocketServer.emitLeaderboardUpdate).mockImplementation(() => {
      throw new Error("WebSocket error");
    });

    // Should not throw - errors are logged but don't propagate
    await expect(leaderboardService.broadcastLeaderboardUpdate("game-1")).resolves.toBeUndefined();
  });

  it("broadcasts with empty players array when no complete picks", async () => {
    vi.mocked(pickModel.getLeaderboard).mockResolvedValue([]);
    vi.mocked(websocketServer.emitLeaderboardUpdate).mockReturnValue(undefined);

    await leaderboardService.broadcastLeaderboardUpdate("game-1");

    expect(websocketServer.emitLeaderboardUpdate).toHaveBeenCalledWith("game-1", {
      gameId: "game-1",
      players: [],
      timestamp: expect.any(Number),
    });
  });
});

describe("leaderboardService.markCurrentUser", () => {
  it("correctly marks the current user in the players list", () => {
    const players: LeaderboardPlayer[] = [
      {
        correctCount: 3,
        email: "alice@example.com",
        image: null,
        isCurrentUser: false,
        name: "Alice",
        rank: 1,
        totalScore: 15,
        userId: "user-1",
      },
      {
        correctCount: 2,
        email: "bob@example.com",
        image: null,
        isCurrentUser: false,
        name: "Bob",
        rank: 2,
        totalScore: 10,
        userId: "user-2",
      },
      {
        correctCount: 1,
        email: "charlie@example.com",
        image: null,
        isCurrentUser: false,
        name: "Charlie",
        rank: 3,
        totalScore: 5,
        userId: "user-3",
      },
    ];

    const result = leaderboardService.markCurrentUser(players, "user-2");

    expect(result[0].isCurrentUser).toBe(false);
    expect(result[1].isCurrentUser).toBe(true); // Bob is current user
    expect(result[2].isCurrentUser).toBe(false);
  });

  it("does not modify other players when marking current user", () => {
    const players: LeaderboardPlayer[] = [
      {
        correctCount: 3,
        email: "alice@example.com",
        image: null,
        isCurrentUser: false,
        name: "Alice",
        rank: 1,
        totalScore: 15,
        userId: "user-1",
      },
    ];

    const result = leaderboardService.markCurrentUser(players, "user-2");

    expect(result[0]).toMatchObject({
      correctCount: 3,
      email: "alice@example.com",
      image: null,
      isCurrentUser: false, // Not the current user
      name: "Alice",
      rank: 1,
      totalScore: 15,
      userId: "user-1",
    });
  });

  it("handles current user not in the list (all false)", () => {
    const players: LeaderboardPlayer[] = [
      {
        correctCount: 3,
        email: "alice@example.com",
        image: null,
        isCurrentUser: false,
        name: "Alice",
        rank: 1,
        totalScore: 15,
        userId: "user-1",
      },
      {
        correctCount: 2,
        email: "bob@example.com",
        image: null,
        isCurrentUser: false,
        name: "Bob",
        rank: 2,
        totalScore: 10,
        userId: "user-2",
      },
    ];

    const result = leaderboardService.markCurrentUser(players, "user-999");

    expect(result[0].isCurrentUser).toBe(false);
    expect(result[1].isCurrentUser).toBe(false);
  });

  it("returns empty array when players list is empty", () => {
    const result = leaderboardService.markCurrentUser([], "user-1");

    expect(result).toEqual([]);
  });

  it("does not mutate the original players array", () => {
    const players: LeaderboardPlayer[] = [
      {
        correctCount: 3,
        email: "alice@example.com",
        image: null,
        isCurrentUser: false,
        name: "Alice",
        rank: 1,
        totalScore: 15,
        userId: "user-1",
      },
    ];

    const originalIsCurrentUser = players[0].isCurrentUser;
    leaderboardService.markCurrentUser(players, "user-1");

    expect(players[0].isCurrentUser).toBe(originalIsCurrentUser); // Original unchanged
  });
});

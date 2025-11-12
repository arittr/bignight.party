/**
 * Category Service Tests
 *
 * Tests business logic in category-service with mocked model and leaderboard layers.
 * Focus: Winner marking validation, leaderboard broadcast integration, error handling.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as categoryModel from "@/lib/models/category";
import * as gameModel from "@/lib/models/game";
import * as pickModel from "@/lib/models/pick";
import * as categoryService from "@/lib/services/category-service";
import * as gameService from "@/lib/services/game-service";
import * as leaderboardService from "@/lib/services/leaderboard-service";

// Mock all external dependencies
vi.mock("@/lib/models/category");
vi.mock("@/lib/models/game");
vi.mock("@/lib/models/pick");
vi.mock("@/lib/services/game-service");
vi.mock("@/lib/services/leaderboard-service");

describe("categoryService.markWinner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks winner and broadcasts leaderboard update to all games", async () => {
    const mockCategory = {
      eventId: "event-1",
      id: "category-1",
      isRevealed: false,
      name: "Best Picture",
      nominations: [
        { id: "nomination-1", name: "Movie A" },
        { id: "nomination-2", name: "Movie B" },
      ],
      winnerNominationId: null,
    };

    const mockGames = [
      { eventId: "event-1", id: "game-1", name: "Friends Game" },
      { eventId: "event-1", id: "game-2", name: "Work Game" },
    ];

    const mockUpdatedCategory = {
      ...mockCategory,
      isRevealed: true,
      winnerNominationId: "nomination-1",
    };

    vi.mocked(categoryModel.findById).mockResolvedValue(mockCategory as any);
    vi.mocked(categoryModel.markWinner).mockResolvedValue(mockUpdatedCategory as any);
    vi.mocked(gameModel.findByEventId).mockResolvedValue(mockGames as any);
    vi.mocked(leaderboardService.broadcastLeaderboardUpdate).mockResolvedValue(undefined);

    const result = await categoryService.markWinner("category-1", "nomination-1");

    expect(categoryModel.markWinner).toHaveBeenCalledWith("category-1", "nomination-1");
    expect(gameModel.findByEventId).toHaveBeenCalledWith("event-1");
    expect(leaderboardService.broadcastLeaderboardUpdate).toHaveBeenCalledTimes(2);
    expect(leaderboardService.broadcastLeaderboardUpdate).toHaveBeenCalledWith("game-1");
    expect(leaderboardService.broadcastLeaderboardUpdate).toHaveBeenCalledWith("game-2");
    expect(result).toEqual(mockUpdatedCategory);
  });

  it("throws error when category not found", async () => {
    vi.mocked(categoryModel.findById).mockResolvedValue(null);

    await expect(categoryService.markWinner("invalid-category", "nomination-1")).rejects.toThrow(
      "Category with id invalid-category not found"
    );

    expect(categoryModel.markWinner).not.toHaveBeenCalled();
    expect(gameModel.findByEventId).not.toHaveBeenCalled();
  });

  it("throws error when nomination does not belong to category", async () => {
    const mockCategory = {
      eventId: "event-1",
      id: "category-1",
      isRevealed: false,
      name: "Best Picture",
      nominations: [
        { id: "nomination-1", name: "Movie A" },
        { id: "nomination-2", name: "Movie B" },
      ],
      winnerNominationId: null,
    };

    vi.mocked(categoryModel.findById).mockResolvedValue(mockCategory as any);

    await expect(categoryService.markWinner("category-1", "nomination-999")).rejects.toThrow(
      "Nomination nomination-999 does not belong to category category-1"
    );

    expect(categoryModel.markWinner).not.toHaveBeenCalled();
    expect(gameModel.findByEventId).not.toHaveBeenCalled();
  });

  it("does not fail when leaderboard broadcast fails", async () => {
    const mockCategory = {
      eventId: "event-1",
      id: "category-1",
      isRevealed: false,
      name: "Best Picture",
      nominations: [{ id: "nomination-1", name: "Movie A" }],
      winnerNominationId: null,
    };

    const mockUpdatedCategory = {
      ...mockCategory,
      isRevealed: true,
      winnerNominationId: "nomination-1",
    };

    const mockGames = [{ eventId: "event-1", id: "game-1", name: "Game" }];

    vi.mocked(categoryModel.findById).mockResolvedValue(mockCategory as any);
    vi.mocked(categoryModel.markWinner).mockResolvedValue(mockUpdatedCategory as any);
    vi.mocked(gameModel.findByEventId).mockResolvedValue(mockGames as any);
    vi.mocked(leaderboardService.broadcastLeaderboardUpdate).mockRejectedValue(
      new Error("WebSocket error")
    );

    // Should not throw - broadcast errors are caught
    const result = await categoryService.markWinner("category-1", "nomination-1");

    expect(result).toEqual(mockUpdatedCategory);
    expect(categoryModel.markWinner).toHaveBeenCalled();
  });

  it("broadcasts to multiple games when event has multiple games", async () => {
    const mockCategory = {
      eventId: "event-1",
      id: "category-1",
      isRevealed: false,
      name: "Best Picture",
      nominations: [{ id: "nomination-1", name: "Movie A" }],
      winnerNominationId: null,
    };

    const mockGames = [
      { eventId: "event-1", id: "game-1", name: "Game 1" },
      { eventId: "event-1", id: "game-2", name: "Game 2" },
      { eventId: "event-1", id: "game-3", name: "Game 3" },
    ];

    vi.mocked(categoryModel.findById).mockResolvedValue(mockCategory as any);
    vi.mocked(categoryModel.markWinner).mockResolvedValue(mockCategory as any);
    vi.mocked(gameModel.findByEventId).mockResolvedValue(mockGames as any);
    vi.mocked(leaderboardService.broadcastLeaderboardUpdate).mockResolvedValue(undefined);

    await categoryService.markWinner("category-1", "nomination-1");

    expect(leaderboardService.broadcastLeaderboardUpdate).toHaveBeenCalledTimes(3);
  });

  it("does not broadcast when event has no games", async () => {
    const mockCategory = {
      eventId: "event-1",
      id: "category-1",
      isRevealed: false,
      name: "Best Picture",
      nominations: [{ id: "nomination-1", name: "Movie A" }],
      winnerNominationId: null,
    };

    vi.mocked(categoryModel.findById).mockResolvedValue(mockCategory as any);
    vi.mocked(categoryModel.markWinner).mockResolvedValue(mockCategory as any);
    vi.mocked(gameModel.findByEventId).mockResolvedValue([]);
    vi.mocked(leaderboardService.broadcastLeaderboardUpdate).mockResolvedValue(undefined);

    await categoryService.markWinner("category-1", "nomination-1");

    expect(leaderboardService.broadcastLeaderboardUpdate).not.toHaveBeenCalled();
  });
});

describe("categoryService.clearWinner", () => {
  it("clears winner and sets isRevealed to false", async () => {
    const mockCategory = {
      id: "category-1",
      isRevealed: false,
      name: "Best Picture",
      winnerNominationId: null,
    };

    vi.mocked(categoryModel.clearWinner).mockResolvedValue(mockCategory as any);

    const result = await categoryService.clearWinner("category-1");

    expect(categoryModel.clearWinner).toHaveBeenCalledWith("category-1");
    expect(result).toEqual(mockCategory);
  });
});

describe("categoryService.markWinnerAndUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks winner, broadcasts, and completes game when all categories revealed", async () => {
    const mockCategory = {
      eventId: "event-1",
      id: "category-1",
      isRevealed: false,
      name: "Best Picture",
      nominations: [
        { id: "nomination-1", name: "Movie A" },
        { id: "nomination-2", name: "Movie B" },
      ],
      winnerNominationId: null,
    };

    const mockGames = [{ eventId: "event-1", id: "game-1", name: "Game" }];

    const mockUpdatedCategory = {
      ...mockCategory,
      isRevealed: true,
      winnerNominationId: "nomination-1",
    };

    vi.mocked(categoryModel.findById).mockResolvedValue(mockCategory as any);
    vi.mocked(categoryModel.markWinner).mockResolvedValue(mockUpdatedCategory as any);
    vi.mocked(gameModel.findByEventId).mockResolvedValue(mockGames as any);
    vi.mocked(leaderboardService.broadcastLeaderboardUpdate).mockResolvedValue(undefined);
    vi.mocked(pickModel.areAllCategoriesRevealed).mockResolvedValue(true); // All revealed
    vi.mocked(gameService.completeGame).mockResolvedValue(undefined as any);

    const result = await categoryService.markWinnerAndUpdate("category-1", "nomination-1", "game-1");

    expect(categoryModel.markWinner).toHaveBeenCalledWith("category-1", "nomination-1");
    expect(pickModel.areAllCategoriesRevealed).toHaveBeenCalledWith("game-1");
    expect(gameService.completeGame).toHaveBeenCalledWith("game-1");
    expect(result).toEqual(mockUpdatedCategory);
  });

  it("does not complete game when categories remain unrevealed", async () => {
    const mockCategory = {
      eventId: "event-1",
      id: "category-1",
      isRevealed: false,
      name: "Best Picture",
      nominations: [{ id: "nomination-1", name: "Movie A" }],
      winnerNominationId: null,
    };

    const mockGames = [{ eventId: "event-1", id: "game-1", name: "Game" }];

    const mockUpdatedCategory = {
      ...mockCategory,
      isRevealed: true,
      winnerNominationId: "nomination-1",
    };

    vi.mocked(categoryModel.findById).mockResolvedValue(mockCategory as any);
    vi.mocked(categoryModel.markWinner).mockResolvedValue(mockUpdatedCategory as any);
    vi.mocked(gameModel.findByEventId).mockResolvedValue(mockGames as any);
    vi.mocked(leaderboardService.broadcastLeaderboardUpdate).mockResolvedValue(undefined);
    vi.mocked(pickModel.areAllCategoriesRevealed).mockResolvedValue(false); // NOT all revealed

    const result = await categoryService.markWinnerAndUpdate("category-1", "nomination-1", "game-1");

    expect(pickModel.areAllCategoriesRevealed).toHaveBeenCalledWith("game-1");
    expect(gameService.completeGame).not.toHaveBeenCalled();
    expect(result).toEqual(mockUpdatedCategory);
  });

  it("throws error when category not found", async () => {
    vi.mocked(categoryModel.findById).mockResolvedValue(null);

    await expect(
      categoryService.markWinnerAndUpdate("invalid-category", "nomination-1", "game-1")
    ).rejects.toThrow("Category with id invalid-category not found");

    expect(categoryModel.markWinner).not.toHaveBeenCalled();
    expect(pickModel.areAllCategoriesRevealed).not.toHaveBeenCalled();
    expect(gameService.completeGame).not.toHaveBeenCalled();
  });

  it("throws error when nomination does not belong to category", async () => {
    const mockCategory = {
      eventId: "event-1",
      id: "category-1",
      isRevealed: false,
      name: "Best Picture",
      nominations: [{ id: "nomination-1", name: "Movie A" }],
      winnerNominationId: null,
    };

    vi.mocked(categoryModel.findById).mockResolvedValue(mockCategory as any);

    await expect(
      categoryService.markWinnerAndUpdate("category-1", "nomination-999", "game-1")
    ).rejects.toThrow("Nomination nomination-999 does not belong to category category-1");

    expect(categoryModel.markWinner).not.toHaveBeenCalled();
    expect(pickModel.areAllCategoriesRevealed).not.toHaveBeenCalled();
    expect(gameService.completeGame).not.toHaveBeenCalled();
  });

  it("does not fail when game completion check fails", async () => {
    const mockCategory = {
      eventId: "event-1",
      id: "category-1",
      isRevealed: false,
      name: "Best Picture",
      nominations: [{ id: "nomination-1", name: "Movie A" }],
      winnerNominationId: null,
    };

    const mockGames = [{ eventId: "event-1", id: "game-1", name: "Game" }];

    const mockUpdatedCategory = {
      ...mockCategory,
      isRevealed: true,
      winnerNominationId: "nomination-1",
    };

    vi.mocked(categoryModel.findById).mockResolvedValue(mockCategory as any);
    vi.mocked(categoryModel.markWinner).mockResolvedValue(mockUpdatedCategory as any);
    vi.mocked(gameModel.findByEventId).mockResolvedValue(mockGames as any);
    vi.mocked(leaderboardService.broadcastLeaderboardUpdate).mockResolvedValue(undefined);
    vi.mocked(pickModel.areAllCategoriesRevealed).mockRejectedValue(new Error("DB error"));

    // Should not throw - game completion errors are caught
    const result = await categoryService.markWinnerAndUpdate("category-1", "nomination-1", "game-1");

    expect(result).toEqual(mockUpdatedCategory);
    expect(categoryModel.markWinner).toHaveBeenCalled();
  });

  it("broadcasts leaderboard updates to all games", async () => {
    const mockCategory = {
      eventId: "event-1",
      id: "category-1",
      isRevealed: false,
      name: "Best Picture",
      nominations: [{ id: "nomination-1", name: "Movie A" }],
      winnerNominationId: null,
    };

    const mockGames = [
      { eventId: "event-1", id: "game-1", name: "Game 1" },
      { eventId: "event-1", id: "game-2", name: "Game 2" },
    ];

    vi.mocked(categoryModel.findById).mockResolvedValue(mockCategory as any);
    vi.mocked(categoryModel.markWinner).mockResolvedValue(mockCategory as any);
    vi.mocked(gameModel.findByEventId).mockResolvedValue(mockGames as any);
    vi.mocked(leaderboardService.broadcastLeaderboardUpdate).mockResolvedValue(undefined);
    vi.mocked(pickModel.areAllCategoriesRevealed).mockResolvedValue(false);

    await categoryService.markWinnerAndUpdate("category-1", "nomination-1", "game-1");

    expect(leaderboardService.broadcastLeaderboardUpdate).toHaveBeenCalledTimes(2);
    expect(leaderboardService.broadcastLeaderboardUpdate).toHaveBeenCalledWith("game-1");
    expect(leaderboardService.broadcastLeaderboardUpdate).toHaveBeenCalledWith("game-2");
  });
});

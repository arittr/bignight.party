/**
 * Game Service Tests
 *
 * Tests business logic in game-service with mocked model layer.
 * Focus: State transitions, validation, orchestration logic.
 */

import { buildCategory, buildGame, buildGameParticipant } from "tests/factories";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as categoryModel from "@/lib/models/category";
import * as gameModel from "@/lib/models/game";
import * as gameParticipantModel from "@/lib/models/game-participant";
import * as pickModel from "@/lib/models/pick";
import * as gameService from "../game-service";

// Mock all model imports
vi.mock("@/lib/models/game");
vi.mock("@/lib/models/game-participant");
vi.mock("@/lib/models/pick");
vi.mock("@/lib/models/category");

describe("gameService.joinGame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates GameParticipant when game exists with matching accessCode", async () => {
    const mockGame = buildGame({
      accessCode: "TEST123",
      id: "game-1",
      status: "OPEN"
    });
    const mockParticipant = buildGameParticipant({
      gameId: "game-1",
      id: "participant-1",
      userId: "user-1",
    });

    vi.mocked(gameModel.findByAccessCode).mockResolvedValue(null);
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(false);
    vi.mocked(gameParticipantModel.create).mockResolvedValue(mockParticipant);

    // Mock the compound key query that doesn't exist yet in gameModel
    vi.spyOn(gameModel, 'findById' as any).mockImplementation(async (id: string) => {
      if (id === "game-1") return mockGame as any;
      return null;
    });

    const result = await gameService.joinGame("user-1", "game-1", "TEST123");

    expect(gameParticipantModel.exists).toHaveBeenCalledWith("user-1", "game-1");
    expect(gameParticipantModel.create).toHaveBeenCalledWith({
      gameId: "game-1",
      userId: "user-1",
    });
    expect(result.id).toBe("participant-1");
  });

  it("throws when game does not exist (invalid gameId)", async () => {
    vi.mocked(gameModel.findByAccessCode).mockResolvedValue(null);
    vi.spyOn(gameModel, 'findById' as any).mockResolvedValue(null);

    await expect(
      gameService.joinGame("user-1", "invalid-game", "TEST123")
    ).rejects.toThrow("Game not found or invalid access code");

    expect(gameParticipantModel.create).not.toHaveBeenCalled();
  });

  it("throws when accessCode does not match (compound key mismatch)", async () => {
    const mockGame = buildGame({
      accessCode: "CORRECT",
      id: "game-1",
      status: "OPEN"
    });

    vi.mocked(gameModel.findByAccessCode).mockResolvedValue(null);
    vi.spyOn(gameModel, 'findById' as any).mockImplementation(async (id: string) => {
      if (id === "game-1") return mockGame as any;
      return null;
    });

    await expect(
      gameService.joinGame("user-1", "game-1", "WRONG123")
    ).rejects.toThrow("Game not found or invalid access code");

    expect(gameParticipantModel.create).not.toHaveBeenCalled();
  });

  it("rejects join when game status is SETUP", async () => {
    const mockGame = buildGame({
      accessCode: "TEST123",
      id: "game-1",
      status: "SETUP"
    });

    vi.mocked(gameModel.findByAccessCode).mockResolvedValue(null);
    vi.spyOn(gameModel, 'findById' as any).mockImplementation(async (id: string) => {
      if (id === "game-1") return mockGame as any;
      return null;
    });

    await expect(
      gameService.joinGame("user-1", "game-1", "TEST123")
    ).rejects.toThrow("Cannot join game in SETUP status");

    expect(gameParticipantModel.create).not.toHaveBeenCalled();
  });

  it("allows join when game status is OPEN", async () => {
    const mockGame = buildGame({
      accessCode: "TEST123",
      id: "game-1",
      status: "OPEN"
    });
    const mockParticipant = buildGameParticipant({
      gameId: "game-1",
      id: "participant-1",
      userId: "user-1",
    });

    vi.mocked(gameModel.findByAccessCode).mockResolvedValue(null);
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(false);
    vi.mocked(gameParticipantModel.create).mockResolvedValue(mockParticipant);
    vi.spyOn(gameModel, 'findById' as any).mockImplementation(async (id: string) => {
      if (id === "game-1") return mockGame as any;
      return null;
    });

    const result = await gameService.joinGame("user-1", "game-1", "TEST123");

    expect(result.id).toBe("participant-1");
  });

  it("allows join when game status is LIVE", async () => {
    const mockGame = buildGame({
      accessCode: "TEST123",
      id: "game-1",
      status: "LIVE"
    });
    const mockParticipant = buildGameParticipant({
      gameId: "game-1",
      id: "participant-1",
      userId: "user-1",
    });

    vi.mocked(gameModel.findByAccessCode).mockResolvedValue(null);
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(false);
    vi.mocked(gameParticipantModel.create).mockResolvedValue(mockParticipant);
    vi.spyOn(gameModel, 'findById' as any).mockImplementation(async (id: string) => {
      if (id === "game-1") return mockGame as any;
      return null;
    });

    const result = await gameService.joinGame("user-1", "game-1", "TEST123");

    expect(result.id).toBe("participant-1");
  });

  it("rejects join when game status is COMPLETED", async () => {
    const mockGame = buildGame({
      accessCode: "TEST123",
      id: "game-1",
      status: "COMPLETED"
    });

    vi.mocked(gameModel.findByAccessCode).mockResolvedValue(null);
    vi.spyOn(gameModel, 'findById' as any).mockImplementation(async (id: string) => {
      if (id === "game-1") return mockGame as any;
      return null;
    });

    await expect(
      gameService.joinGame("user-1", "game-1", "TEST123")
    ).rejects.toThrow("Cannot join game in COMPLETED status");

    expect(gameParticipantModel.create).not.toHaveBeenCalled();
  });

  it("returns existing participant when user is already a member (idempotent)", async () => {
    const mockGame = buildGame({
      accessCode: "TEST123",
      id: "game-1",
      status: "OPEN"
    });
    const existingParticipant = buildGameParticipant({
      gameId: "game-1",
      id: "existing-1",
      userId: "user-1",
    });

    vi.mocked(gameModel.findByAccessCode).mockResolvedValue(null);
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(true);
    vi.spyOn(gameModel, 'findById' as any).mockImplementation(async (id: string) => {
      if (id === "game-1") return mockGame as any;
      return null;
    });

    // Mock findUnique to return existing participant
    vi.spyOn(gameParticipantModel, 'findByUserId' as any).mockResolvedValue([existingParticipant]);

    const result = await gameService.joinGame("user-1", "game-1", "TEST123");

    expect(gameParticipantModel.exists).toHaveBeenCalledWith("user-1", "game-1");
    expect(gameParticipantModel.create).not.toHaveBeenCalled();
    expect(result.id).toBe("existing-1");
  });
});

describe("gameService.checkMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when user is participant", async () => {
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(true);

    const result = await gameService.checkMembership("user-1", "game-1");

    expect(gameParticipantModel.exists).toHaveBeenCalledWith("user-1", "game-1");
    expect(result).toBe(true);
  });

  it("returns false when user is not participant", async () => {
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(false);

    const result = await gameService.checkMembership("user-1", "game-1");

    expect(gameParticipantModel.exists).toHaveBeenCalledWith("user-1", "game-1");
    expect(result).toBe(false);
  });
});

describe("gameService.getUserGames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all games with completion counts", async () => {
    const mockGame = buildGame({
      eventId: "event-1",
      id: "game-1",
      name: "Test Game",
    });

    const mockParticipant = {
      ...buildGameParticipant({
        gameId: "game-1",
        id: "participant-1",
        userId: "user-1",
      }),
      game: mockGame,
    };

    vi.mocked(gameParticipantModel.findByUserId).mockResolvedValue([mockParticipant as any]);
    vi.mocked(pickModel.getPicksCountByGameAndUser).mockResolvedValue(5);
    vi.mocked(categoryModel.getCategoriesByEventId).mockResolvedValue([
      buildCategory({ id: "1" }),
      buildCategory({ id: "2" }),
      buildCategory({ id: "3" }),
      buildCategory({ id: "4" }),
      buildCategory({ id: "5" }),
      buildCategory({ id: "6" }),
    ] as any);

    const result = await gameService.getUserGames("user-1");

    expect(gameParticipantModel.findByUserId).toHaveBeenCalledWith("user-1");
    expect(pickModel.getPicksCountByGameAndUser).toHaveBeenCalledWith("game-1", "user-1");
    expect(categoryModel.getCategoriesByEventId).toHaveBeenCalledWith("event-1");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      game: expect.any(Object),
      picksCount: 5,
      totalCategories: 6,
    });
  });

  it("returns empty array when user has no games", async () => {
    vi.mocked(gameParticipantModel.findByUserId).mockResolvedValue([]);

    const result = await gameService.getUserGames("user-1");

    expect(result).toEqual([]);
  });
});

describe("gameService.resolveAccessCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { gameId, isMember: true } when user is member", async () => {
    const mockGame = buildGame({ accessCode: "TEST123", id: "game-1" });

    vi.mocked(gameModel.findByAccessCode).mockResolvedValue(mockGame as any);
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(true);

    const result = await gameService.resolveAccessCode("TEST123", "user-1");

    expect(gameModel.findByAccessCode).toHaveBeenCalledWith("TEST123");
    expect(gameParticipantModel.exists).toHaveBeenCalledWith("user-1", "game-1");
    expect(result).toEqual({ gameId: "game-1", isMember: true });
  });

  it("returns { gameId, isMember: false } when user is not member", async () => {
    const mockGame = buildGame({ accessCode: "TEST123", id: "game-1" });

    vi.mocked(gameModel.findByAccessCode).mockResolvedValue(mockGame as any);
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(false);

    const result = await gameService.resolveAccessCode("TEST123", "user-1");

    expect(result).toEqual({ gameId: "game-1", isMember: false });
  });

  it("throws when access code is invalid", async () => {
    vi.mocked(gameModel.findByAccessCode).mockResolvedValue(null);

    await expect(gameService.resolveAccessCode("INVALID", "user-1")).rejects.toThrow(
      "Game with access code INVALID not found"
    );
  });
});

describe("gameService.updateGameStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows valid state transitions using ts-pattern", async () => {
    const mockGame = buildGame({ id: "game-1", status: "SETUP" });
    const updatedGame = buildGame({ id: "game-1", picksLockAt: new Date(), status: "OPEN" });

    vi.mocked(gameModel.findById).mockResolvedValue(mockGame as any);
    vi.mocked(gameModel.update).mockResolvedValue(updatedGame as any);

    const result = await gameService.updateGameStatus("game-1", "OPEN");

    expect(gameModel.findById).toHaveBeenCalledWith("game-1");
    expect(gameModel.update).toHaveBeenCalledWith("game-1", { status: "OPEN" });
    expect(result.status).toBe("OPEN");
  });

  it("rejects invalid state transitions", async () => {
    const mockGame = buildGame({ id: "game-1", status: "SETUP" });

    vi.mocked(gameModel.findById).mockResolvedValue(mockGame as any);

    await expect(gameService.updateGameStatus("game-1", "COMPLETED")).rejects.toThrow(
      "Invalid status transition from SETUP to COMPLETED"
    );
  });

  it("validates picksLockAt when transitioning to OPEN", async () => {
    const mockGame = buildGame({ id: "game-1", picksLockAt: null, status: "SETUP" });

    vi.mocked(gameModel.findById).mockResolvedValue(mockGame as any);

    await expect(gameService.updateGameStatus("game-1", "OPEN")).rejects.toThrow(
      "Cannot open game without picksLockAt date"
    );
  });

  it("throws when game does not exist", async () => {
    vi.mocked(gameModel.findById).mockResolvedValue(null);

    await expect(gameService.updateGameStatus("invalid-game", "OPEN")).rejects.toThrow(
      "Game with id invalid-game not found"
    );
  });
});

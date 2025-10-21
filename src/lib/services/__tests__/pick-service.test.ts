/**
 * Pick Service Tests
 *
 * Tests business logic in pick-service with mocked model layer.
 * Focus: State machine validation using ts-pattern with .exhaustive(),
 * validation rules, error handling.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as pickService from "../pick-service";
import * as pickModel from "@/lib/models/pick";
import * as gameModel from "@/lib/models/game";
import * as gameParticipantModel from "@/lib/models/game-participant";
import * as nominationModel from "@/lib/models/nomination";
import { buildPick, buildGame, buildNomination } from "tests/factories";

// Mock all model imports
vi.mock("@/lib/models/pick");
vi.mock("@/lib/models/game");
vi.mock("@/lib/models/game-participant");
vi.mock("@/lib/models/nomination");

describe("pickService.submitPick", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects pick when user is not a game participant", async () => {
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(false);

    await expect(
      pickService.submitPick("user-1", {
        gameId: "game-1",
        categoryId: "category-1",
        nominationId: "nomination-1",
      })
    ).rejects.toThrow("User is not a participant in this game");
  });

  it("rejects pick when game status is SETUP (ts-pattern exhaustive)", async () => {
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(true);
    vi.mocked(gameModel.findById).mockResolvedValue(
      buildGame({ id: "game-1", status: "SETUP" }) as any
    );

    await expect(
      pickService.submitPick("user-1", {
        gameId: "game-1",
        categoryId: "category-1",
        nominationId: "nomination-1",
      })
    ).rejects.toThrow("Game is not accepting picks");
  });

  it("rejects pick when game status is LIVE (ts-pattern exhaustive)", async () => {
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(true);
    vi.mocked(gameModel.findById).mockResolvedValue(
      buildGame({ id: "game-1", status: "LIVE" }) as any
    );

    await expect(
      pickService.submitPick("user-1", {
        gameId: "game-1",
        categoryId: "category-1",
        nominationId: "nomination-1",
      })
    ).rejects.toThrow("Game is not accepting picks");
  });

  it("rejects pick when game status is COMPLETED (ts-pattern exhaustive)", async () => {
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(true);
    vi.mocked(gameModel.findById).mockResolvedValue(
      buildGame({ id: "game-1", status: "COMPLETED" }) as any
    );

    await expect(
      pickService.submitPick("user-1", {
        gameId: "game-1",
        categoryId: "category-1",
        nominationId: "nomination-1",
      })
    ).rejects.toThrow("Game is not accepting picks");
  });

  it("accepts pick when game status is OPEN (ts-pattern exhaustive)", async () => {
    const mockPick = buildPick({
      id: "pick-1",
      gameId: "game-1",
      userId: "user-1",
      categoryId: "category-1",
      nominationId: "nomination-1",
    });

    vi.mocked(gameParticipantModel.exists).mockResolvedValue(true);
    vi.mocked(gameModel.findById).mockResolvedValue({
      ...buildGame({ id: "game-1", status: "OPEN" }),
      event: {} as any,
      picks: [],
    });
    vi.mocked(nominationModel.findById).mockResolvedValue({
      ...buildNomination({ id: "nomination-1", categoryId: "category-1" }),
      category: {} as any,
      work: null,
      person: null,
    });
    vi.mocked(pickModel.upsert).mockResolvedValue({
      ...mockPick,
      category: {} as any,
      nomination: {} as any,
    });

    const result = await pickService.submitPick("user-1", {
      gameId: "game-1",
      categoryId: "category-1",
      nominationId: "nomination-1",
    });

    expect(result).toMatchObject(mockPick);
    expect(pickModel.upsert).toHaveBeenCalledWith({
      gameId: "game-1",
      userId: "user-1",
      categoryId: "category-1",
      nominationId: "nomination-1",
    });
  });

  it("rejects pick when nomination does not belong to category", async () => {
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(true);
    vi.mocked(gameModel.findById).mockResolvedValue(
      buildGame({ id: "game-1", status: "OPEN" }) as any
    );
    vi.mocked(nominationModel.findById).mockResolvedValue(
      buildNomination({
        id: "nomination-1",
        categoryId: "category-2", // Different category!
      }) as any
    );

    await expect(
      pickService.submitPick("user-1", {
        gameId: "game-1",
        categoryId: "category-1",
        nominationId: "nomination-1",
      })
    ).rejects.toThrow("Nomination does not belong to this category");
  });

  it("successfully creates pick when all validations pass", async () => {
    const mockPick = buildPick({
      id: "pick-1",
      gameId: "game-1",
      userId: "user-1",
      categoryId: "category-1",
      nominationId: "nomination-1",
    });

    vi.mocked(gameParticipantModel.exists).mockResolvedValue(true);
    vi.mocked(gameModel.findById).mockResolvedValue(
      buildGame({ id: "game-1", status: "OPEN" }) as any
    );
    vi.mocked(nominationModel.findById).mockResolvedValue(
      buildNomination({ id: "nomination-1", categoryId: "category-1" }) as any
    );
    vi.mocked(pickModel.upsert).mockResolvedValue(mockPick as any);

    const result = await pickService.submitPick("user-1", {
      gameId: "game-1",
      categoryId: "category-1",
      nominationId: "nomination-1",
    });

    expect(result).toEqual(mockPick);
    expect(pickModel.upsert).toHaveBeenCalledWith({
      gameId: "game-1",
      userId: "user-1",
      categoryId: "category-1",
      nominationId: "nomination-1",
    });
  });

  it("successfully updates existing pick when all validations pass", async () => {
    const mockUpdatedPick = buildPick({
      id: "pick-1",
      gameId: "game-1",
      userId: "user-1",
      categoryId: "category-1",
      nominationId: "nomination-2", // Changed nomination
    });

    vi.mocked(gameParticipantModel.exists).mockResolvedValue(true);
    vi.mocked(gameModel.findById).mockResolvedValue(
      buildGame({ id: "game-1", status: "OPEN" }) as any
    );
    vi.mocked(nominationModel.findById).mockResolvedValue(
      buildNomination({ id: "nomination-2", categoryId: "category-1" }) as any
    );
    vi.mocked(pickModel.upsert).mockResolvedValue(mockUpdatedPick as any);

    const result = await pickService.submitPick("user-1", {
      gameId: "game-1",
      categoryId: "category-1",
      nominationId: "nomination-2",
    });

    expect(result).toEqual(mockUpdatedPick);
  });

  it("throws when game does not exist", async () => {
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(true);
    vi.mocked(gameModel.findById).mockResolvedValue(null);

    await expect(
      pickService.submitPick("user-1", {
        gameId: "invalid-game",
        categoryId: "category-1",
        nominationId: "nomination-1",
      })
    ).rejects.toThrow("Game with id invalid-game not found");
  });

  it("throws when nomination does not exist", async () => {
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(true);
    vi.mocked(gameModel.findById).mockResolvedValue(
      buildGame({ id: "game-1", status: "OPEN" }) as any
    );
    vi.mocked(nominationModel.findById).mockResolvedValue(null);

    await expect(
      pickService.submitPick("user-1", {
        gameId: "game-1",
        categoryId: "category-1",
        nominationId: "invalid-nomination",
      })
    ).rejects.toThrow("Nomination with id invalid-nomination not found");
  });
});

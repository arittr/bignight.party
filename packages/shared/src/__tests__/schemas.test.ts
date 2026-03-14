import { describe, expect, it } from "vitest";
import {
  PlayerSchema, CreatePlayerSchema, SubmitPickSchema, MarkWinnerSchema,
  JoinResponseSchema, GameStateResponseSchema, CategoriesResponseSchema,
  PicksResponseSchema, SubmitPickResponseSchema, LeaderboardResponseSchema,
} from "../schemas";
import { ALLOWED_REACTIONS } from "../constants";

describe("PlayerSchema", () => {
  it("validates a valid player", () => {
    const result = PlayerSchema.safeParse({
      id: "clx1234567890",
      name: "Drew",
      pin: "$2b$10$hashedvalue",
      createdAt: 1710000000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = CreatePlayerSchema.safeParse({ name: "", pin: "1234" });
    expect(result.success).toBe(false);
  });

  it("rejects pin shorter than 4 chars", () => {
    const result = CreatePlayerSchema.safeParse({ name: "Drew", pin: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects pin longer than 6 chars", () => {
    const result = CreatePlayerSchema.safeParse({ name: "Drew", pin: "1234567" });
    expect(result.success).toBe(false);
  });

  it("accepts valid create input", () => {
    const result = CreatePlayerSchema.safeParse({ name: "Drew", pin: "1234" });
    expect(result.success).toBe(true);
  });
});

describe("SubmitPickSchema", () => {
  it("validates valid pick submission", () => {
    expect(SubmitPickSchema.safeParse({ categoryId: "cat_1", nominationId: "nom_1" }).success).toBe(true);
  });
  it("rejects missing categoryId", () => {
    expect(SubmitPickSchema.safeParse({ nominationId: "nom_1" }).success).toBe(false);
  });
});

describe("MarkWinnerSchema", () => {
  it("validates valid winner marking", () => {
    expect(MarkWinnerSchema.safeParse({ categoryId: "cat_1", nominationId: "nom_1" }).success).toBe(true);
  });
});

describe("JoinResponseSchema", () => {
  it("validates a valid join response", () => {
    const result = JoinResponseSchema.safeParse({
      token: "eyJhbGciOiJIUzI1NiJ9.abc.def",
      playerId: "clx123",
      name: "Drew",
    });
    expect(result.success).toBe(true);
  });

  it("rejects response missing token", () => {
    expect(JoinResponseSchema.safeParse({ playerId: "clx123", name: "Drew" }).success).toBe(false);
  });
});

describe("GameStateResponseSchema", () => {
  it("validates setup phase with no config", () => {
    const result = GameStateResponseSchema.safeParse({
      phase: "setup",
      config: null,
      categoryCount: 0,
    });
    expect(result.success).toBe(true);
  });

  it("validates open phase with config", () => {
    const result = GameStateResponseSchema.safeParse({
      phase: "open",
      config: { id: 1, picksLockAt: 1710000000, completedAt: null },
      categoryCount: 23,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid phase", () => {
    expect(GameStateResponseSchema.safeParse({
      phase: "invalid",
      config: null,
      categoryCount: 0,
    }).success).toBe(false);
  });
});

describe("CategoriesResponseSchema", () => {
  it("validates response with categories and nominations", () => {
    const result = CategoriesResponseSchema.safeParse({
      categories: [{
        id: "cat_1",
        name: "Best Picture",
        order: 0,
        points: 1,
        winnerId: null,
        isRevealed: false,
        createdAt: 1710000000,
        nominations: [{
          id: "nom_1",
          categoryId: "cat_1",
          title: "Anora",
          subtitle: "Sean Baker",
          imageUrl: null,
          createdAt: 1710000000,
        }],
      }],
    });
    expect(result.success).toBe(true);
  });

  it("validates empty categories array", () => {
    expect(CategoriesResponseSchema.safeParse({ categories: [] }).success).toBe(true);
  });

  it("rejects if categories key is missing", () => {
    expect(CategoriesResponseSchema.safeParse([]).success).toBe(false);
  });
});

describe("PicksResponseSchema", () => {
  it("validates response with picks array", () => {
    const result = PicksResponseSchema.safeParse({
      picks: [{
        id: "pick_1",
        playerId: "p1",
        categoryId: "cat_1",
        nominationId: "nom_1",
        createdAt: 1710000000,
        updatedAt: 1710000000,
      }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects bare array (the bug we caught)", () => {
    expect(PicksResponseSchema.safeParse([{
      id: "pick_1",
      playerId: "p1",
      categoryId: "cat_1",
      nominationId: "nom_1",
      createdAt: 1710000000,
      updatedAt: 1710000000,
    }]).success).toBe(false);
  });
});

describe("SubmitPickResponseSchema", () => {
  it("validates response with pick object", () => {
    const result = SubmitPickResponseSchema.safeParse({
      pick: {
        id: "pick_1",
        playerId: "p1",
        categoryId: "cat_1",
        nominationId: "nom_1",
        createdAt: 1710000000,
        updatedAt: 1710000000,
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("LeaderboardResponseSchema", () => {
  it("validates response with players and counts", () => {
    const result = LeaderboardResponseSchema.safeParse({
      players: [{
        playerId: "p1",
        name: "Drew",
        totalScore: 5,
        correctCount: 3,
        rank: 1,
      }],
      revealedCount: 10,
      totalCount: 23,
    });
    expect(result.success).toBe(true);
  });

  it("validates empty leaderboard", () => {
    const result = LeaderboardResponseSchema.safeParse({
      players: [],
      revealedCount: 0,
      totalCount: 23,
    });
    expect(result.success).toBe(true);
  });
});

describe("ALLOWED_REACTIONS", () => {
  it("contains exactly five emojis", () => {
    expect(ALLOWED_REACTIONS).toHaveLength(5);
  });
  it("includes expected emojis", () => {
    expect(ALLOWED_REACTIONS).toContain("🔥");
    expect(ALLOWED_REACTIONS).toContain("💕");
    expect(ALLOWED_REACTIONS).toContain("💩");
    expect(ALLOWED_REACTIONS).toContain("💀");
    expect(ALLOWED_REACTIONS).toContain("👏");
  });
});

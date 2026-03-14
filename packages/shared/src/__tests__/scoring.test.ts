import { describe, expect, it } from "vitest";
import { calculatePlayerScore, buildLeaderboard } from "../scoring";

describe("calculatePlayerScore", () => {
  it("returns zero for no revealed categories", () => {
    const picks = [
      { nominationId: "nom_1", categoryWinnerId: null, categoryIsRevealed: false, categoryPoints: 1 },
    ];
    expect(calculatePlayerScore(picks)).toEqual({ totalScore: 0, correctCount: 0 });
  });

  it("scores correct pick in revealed category", () => {
    const picks = [
      { nominationId: "nom_1", categoryWinnerId: "nom_1", categoryIsRevealed: true, categoryPoints: 1 },
    ];
    expect(calculatePlayerScore(picks)).toEqual({ totalScore: 1, correctCount: 1 });
  });

  it("does not score incorrect pick", () => {
    const picks = [
      { nominationId: "nom_1", categoryWinnerId: "nom_2", categoryIsRevealed: true, categoryPoints: 1 },
    ];
    expect(calculatePlayerScore(picks)).toEqual({ totalScore: 0, correctCount: 0 });
  });

  it("respects category point values", () => {
    const picks = [
      { nominationId: "nom_1", categoryWinnerId: "nom_1", categoryIsRevealed: true, categoryPoints: 3 },
      { nominationId: "nom_2", categoryWinnerId: "nom_2", categoryIsRevealed: true, categoryPoints: 2 },
    ];
    expect(calculatePlayerScore(picks)).toEqual({ totalScore: 5, correctCount: 2 });
  });

  it("ignores unrevealed categories even if winner is set", () => {
    const picks = [
      { nominationId: "nom_1", categoryWinnerId: "nom_1", categoryIsRevealed: false, categoryPoints: 1 },
    ];
    expect(calculatePlayerScore(picks)).toEqual({ totalScore: 0, correctCount: 0 });
  });
});

describe("buildLeaderboard", () => {
  it("sorts by totalScore descending", () => {
    const players = [
      { playerId: "p1", name: "Alice", totalScore: 3, correctCount: 3 },
      { playerId: "p2", name: "Bob", totalScore: 5, correctCount: 5 },
    ];
    const result = buildLeaderboard(players);
    expect(result[0].playerId).toBe("p2");
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
  });

  it("breaks ties by correctCount descending", () => {
    const players = [
      { playerId: "p1", name: "Alice", totalScore: 5, correctCount: 3 },
      { playerId: "p2", name: "Bob", totalScore: 5, correctCount: 5 },
    ];
    const result = buildLeaderboard(players);
    expect(result[0].playerId).toBe("p2");
  });

  it("breaks remaining ties by name ascending", () => {
    const players = [
      { playerId: "p1", name: "Zara", totalScore: 5, correctCount: 3 },
      { playerId: "p2", name: "Alice", totalScore: 5, correctCount: 3 },
    ];
    const result = buildLeaderboard(players);
    expect(result[0].name).toBe("Alice");
    expect(result[1].name).toBe("Zara");
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(1); // Same rank — tied
  });

  it("uses gap-aware ranking (1, 1, 3 not 1, 1, 2)", () => {
    const players = [
      { playerId: "p1", name: "Alice", totalScore: 5, correctCount: 5 },
      { playerId: "p2", name: "Bob", totalScore: 5, correctCount: 5 },
      { playerId: "p3", name: "Charlie", totalScore: 3, correctCount: 3 },
    ];
    const result = buildLeaderboard(players);
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(1);
    expect(result[2].rank).toBe(3);
  });

  it("returns empty array for no players", () => {
    expect(buildLeaderboard([])).toEqual([]);
  });
});

import type { LeaderboardPlayer } from "./types";

export interface ScoringPick {
  nominationId: string;
  categoryWinnerId: string | null;
  categoryIsRevealed: boolean;
  categoryPoints: number;
}

export interface PlayerScore {
  playerId: string;
  name: string;
  totalScore: number;
  correctCount: number;
}

export function calculatePlayerScore(picks: ScoringPick[]): { totalScore: number; correctCount: number } {
  let totalScore = 0;
  let correctCount = 0;
  for (const pick of picks) {
    if (pick.categoryIsRevealed && pick.categoryWinnerId !== null) {
      if (pick.nominationId === pick.categoryWinnerId) {
        totalScore += pick.categoryPoints;
        correctCount += 1;
      }
    }
  }
  return { totalScore, correctCount };
}

/**
 * Rank players by score. Expects PRE-FILTERED input: only players who
 * submitted picks for ALL categories should be passed in.
 */
export function buildLeaderboard(players: PlayerScore[]): LeaderboardPlayer[] {
  const sorted = [...players].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return a.name.localeCompare(b.name);
  });

  return sorted.map((player, index) => {
    let rank = index + 1;
    if (index > 0) {
      const prev = sorted[index - 1];
      if (player.totalScore === prev.totalScore && player.correctCount === prev.correctCount) {
        const firstTied = sorted.findIndex(
          (p) => p.totalScore === player.totalScore && p.correctCount === player.correctCount,
        );
        rank = firstTied + 1;
      }
    }
    return { playerId: player.playerId, name: player.name, totalScore: player.totalScore, correctCount: player.correctCount, rank };
  });
}

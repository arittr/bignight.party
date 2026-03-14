import { eq } from "drizzle-orm";
import { calculatePlayerScore, buildLeaderboard } from "@bignight/shared";
import type { PlayerScore, LeaderboardPlayer } from "@bignight/shared";
import type { ScoringPick } from "@bignight/shared";
import { categories, picks, players } from "../db/schema";
import type { Db } from "../db/connection";

export async function getLeaderboard(db: Db): Promise<LeaderboardPlayer[]> {
  // 1. Get all categories
  const allCategories = await db.select().from(categories);
  if (allCategories.length === 0) return [];

  const categoryCount = allCategories.length;
  const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

  // 2. Get all picks with player info
  const allPicks = await db.select().from(picks);
  const allPlayers = await db.select().from(players);
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));

  // 3. Group picks by player
  const picksByPlayer = new Map<string, typeof allPicks>();
  for (const pick of allPicks) {
    const existing = picksByPlayer.get(pick.playerId) ?? [];
    existing.push(pick);
    picksByPlayer.set(pick.playerId, existing);
  }

  // 4. Filter: only players who picked ALL categories
  // 5. Calculate score for each player
  const playerScores: PlayerScore[] = [];

  for (const [playerId, playerPicks] of picksByPlayer) {
    if (playerPicks.length < categoryCount) continue;

    const player = playerMap.get(playerId);
    if (!player) continue;

    const scoringPicks: ScoringPick[] = playerPicks.map((pick) => {
      const cat = categoryMap.get(pick.categoryId)!;
      return {
        nominationId: pick.nominationId,
        categoryWinnerId: cat.winnerId,
        categoryIsRevealed: cat.isRevealed,
        categoryPoints: cat.points,
      };
    });

    const { totalScore, correctCount } = calculatePlayerScore(scoringPicks);
    playerScores.push({ playerId, name: player.name, totalScore, correctCount });
  }

  // 6. Build ranked leaderboard
  return buildLeaderboard(playerScores);
}

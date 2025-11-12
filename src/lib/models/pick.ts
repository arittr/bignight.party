import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";

export async function create(data: Prisma.PickCreateInput) {
  return prisma.pick.create({
    data,
  });
}

export async function findAll() {
  return prisma.pick.findMany({
    include: {
      category: true,
      game: true,
      nomination: true,
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findById(id: string) {
  return prisma.pick.findUnique({
    include: {
      category: true,
      game: true,
      nomination: true,
      user: true,
    },
    where: { id },
  });
}

export async function findByGameId(gameId: string) {
  return prisma.pick.findMany({
    include: {
      category: true,
      game: true,
      nomination: true,
      user: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    where: { gameId },
  });
}

export async function findByUserId(userId: string) {
  return prisma.pick.findMany({
    include: {
      category: true,
      game: true,
      nomination: true,
      user: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    where: { userId },
  });
}

export async function deleteById(id: string) {
  return prisma.pick.delete({
    where: { id },
  });
}

/**
 * Upsert a pick using the unique constraint (gameId + userId + categoryId)
 * Creates if doesn't exist, updates if it does
 */
export async function upsert(data: {
  gameId: string;
  userId: string;
  categoryId: string;
  nominationId: string;
}) {
  return prisma.pick.upsert({
    create: {
      categoryId: data.categoryId,
      gameId: data.gameId,
      nominationId: data.nominationId,
      userId: data.userId,
    },
    include: {
      category: true,
      nomination: true,
    },
    update: {
      nominationId: data.nominationId,
    },
    where: {
      gameId_userId_categoryId: {
        categoryId: data.categoryId,
        gameId: data.gameId,
        userId: data.userId,
      },
    },
  });
}

/**
 * Get all picks for a user in a specific game
 * Includes category and nomination data for UI display
 */
export async function getPicksByGameAndUser(gameId: string, userId: string) {
  return prisma.pick.findMany({
    include: {
      category: true,
      nomination: {
        include: {
          person: true,
          work: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    where: {
      gameId,
      userId,
    },
  });
}

/**
 * Get count of picks for a user in a game
 * Returns raw count only - business logic should be in services layer
 */
export async function getPicksCountByGameAndUser(gameId: string, userId: string) {
  return prisma.pick.count({
    where: {
      gameId,
      userId,
    },
  });
}

/**
 * Delete all picks for a user in a specific game
 */
export async function deleteByUserAndGame(gameId: string, userId: string) {
  return prisma.pick.deleteMany({
    where: {
      gameId,
      userId,
    },
  });
}

/**
 * Get pick counts grouped by nomination for a specific game and category
 * Used for live winner marking to show how many users picked each nomination
 *
 * @example
 * ```ts
 * const pickCounts = await getPickCountsByCategory(gameId, categoryId);
 * // Returns: [{ nominationId: "abc123", count: 5 }, { nominationId: "def456", count: 3 }]
 * ```
 */
export async function getPickCountsByCategory(gameId: string, categoryId: string) {
  const results = await prisma.pick.groupBy({
    _count: {
      id: true,
    },
    by: ["nominationId"],
    where: {
      categoryId,
      gameId,
    },
  });

  return results.map((result) => ({
    count: result._count.id,
    nominationId: result.nominationId,
  }));
}

/**
 * Calculate score for a user's picks in revealed categories
 * Helper function to reduce complexity in getLeaderboard
 */
function calculateUserScore(
  picks: Array<{
    category: { isRevealed: boolean; winnerNominationId: string | null; points: number };
    nominationId: string;
  }>
) {
  let totalScore = 0;
  let correctCount = 0;

  for (const pick of picks) {
    if (pick.category.isRevealed && pick.category.winnerNominationId) {
      if (pick.nominationId === pick.category.winnerNominationId) {
        totalScore += pick.category.points;
        correctCount += 1;
      }
    }
  }

  return { correctCount, totalScore };
}

/**
 * Get leaderboard data for a game
 * Calculates scores based on revealed winners and returns sorted player rankings
 *
 * Only includes users who have submitted picks for ALL categories in the game.
 * Calculates scores only from categories where isRevealed = true.
 * Sorts by totalScore DESC, correctCount DESC, userName ASC.
 * Assigns rank numbers (handles ties - same score = same rank).
 *
 * @param gameId - The game ID to generate leaderboard for
 * @returns Array of players with scores and rankings
 *
 * @example
 * ```ts
 * const leaderboard = await getLeaderboard(gameId);
 * // Returns: [
 * //   { userId: "user1", name: "Alice", email: "alice@example.com", image: null,
 * //     totalScore: 15, correctCount: 3, rank: 1, isCurrentUser: false },
 * //   { userId: "user2", name: "Bob", email: "bob@example.com", image: null,
 * //     totalScore: 10, correctCount: 2, rank: 2, isCurrentUser: false }
 * // ]
 * ```
 */
export async function getLeaderboard(gameId: string) {
  // Get the game with all categories
  const game = await prisma.game.findUnique({
    include: {
      event: {
        include: {
          categories: {
            orderBy: {
              order: "asc",
            },
          },
        },
      },
    },
    where: { id: gameId },
  });

  if (!game) {
    return [];
  }

  const totalCategories = game.event.categories.length;

  // Get all picks for this game with user and category data
  const picks = await prisma.pick.findMany({
    include: {
      category: true,
      user: true,
    },
    where: {
      gameId,
    },
  });

  // Group picks by user
  const picksByUser = picks.reduce(
    (acc, pick) => {
      if (!acc[pick.userId]) {
        acc[pick.userId] = {
          picks: [],
          user: pick.user,
        };
      }
      acc[pick.userId].picks.push(pick);
      return acc;
    },
    {} as Record<string, { picks: typeof picks; user: (typeof picks)[0]["user"] }>
  );

  // Filter users who have complete picks and calculate scores
  const playerScores = Object.entries(picksByUser)
    .filter(([_userId, data]) => data.picks.length === totalCategories)
    .map(([userId, data]) => {
      const { totalScore, correctCount } = calculateUserScore(data.picks);

      return {
        correctCount,
        email: data.user.email,
        image: data.user.image,
        isCurrentUser: false,
        name: data.user.name || data.user.email,
        rank: 0, // Will be calculated after sorting
        totalScore,
        userId,
      };
    });

  // Sort by score DESC, correct count DESC, name ASC
  playerScores.sort((a, b) => {
    if (a.totalScore !== b.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (a.correctCount !== b.correctCount) {
      return b.correctCount - a.correctCount;
    }
    return a.name.localeCompare(b.name);
  });

  // Assign ranks (handle ties)
  let currentRank = 1;
  for (let i = 0; i < playerScores.length; i++) {
    if (i > 0) {
      const prev = playerScores[i - 1];
      const curr = playerScores[i];
      // If score and correct count are same as previous, use same rank
      if (prev.totalScore === curr.totalScore && prev.correctCount === curr.correctCount) {
        playerScores[i].rank = playerScores[i - 1].rank;
      } else {
        currentRank = i + 1;
        playerScores[i].rank = currentRank;
      }
    } else {
      playerScores[i].rank = currentRank;
    }
  }

  return playerScores;
}

/**
 * Get pick counts aggregated by category and nomination for a game
 *
 * Used for live winner marking to show how many users picked each nomination
 * across all categories. Returns aggregated counts grouped by categoryId and nominationId.
 *
 * @param gameId - The game ID to get pick counts for
 * @returns Array of objects with categoryId, nominationId, and count
 *
 * @example
 * ```ts
 * const pickCounts = await getPickCountsForGame(gameId);
 * // Returns: [
 * //   { categoryId: "cat1", nominationId: "nom1", count: 5 },
 * //   { categoryId: "cat1", nominationId: "nom2", count: 3 },
 * //   { categoryId: "cat2", nominationId: "nom3", count: 8 }
 * // ]
 * ```
 */
export async function getPickCountsForGame(gameId: string): Promise<Array<{
  categoryId: string;
  nominationId: string;
  count: number;
}>> {
  const results = await prisma.pick.groupBy({
    by: ["categoryId", "nominationId"],
    _count: {
      id: true,
    },
    where: {
      gameId,
    },
  });

  return results.map((result) => ({
    categoryId: result.categoryId,
    nominationId: result.nominationId,
    count: result._count.id,
  }));
}

/**
 * Check if all categories in a game have been revealed
 *
 * Queries the game with its categories and checks if every category has isRevealed = true.
 * Returns false if game doesn't exist or has no categories.
 *
 * @param gameId - The game ID to check
 * @returns true if ALL categories are revealed, false otherwise
 *
 * @example
 * ```ts
 * const allRevealed = await areAllCategoriesRevealed(gameId);
 * if (allRevealed) {
 *   await gameService.completeGame(gameId);
 * }
 * ```
 */
export async function areAllCategoriesRevealed(gameId: string): Promise<boolean> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      event: {
        include: {
          categories: true,
        },
      },
    },
  });

  if (!game || game.event.categories.length === 0) {
    return false;
  }

  return game.event.categories.every((category) => category.isRevealed === true);
}

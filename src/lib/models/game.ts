import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";

export async function create(data: Prisma.GameCreateInput) {
  return prisma.game.create({
    data,
  });
}

export async function findAll() {
  return prisma.game.findMany({
    include: {
      event: true,
      picks: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Find all games with participant counts
 *
 * Uses Prisma aggregation to fetch participant counts in a single query,
 * eliminating N+1 query problems. This is the optimized version of findAll()
 * for admin list pages that display participant counts.
 *
 * @returns Games with event, picks, and participant counts
 *
 * @example
 * ```tsx
 * const games = await gameModel.findAllWithCounts();
 * games.forEach(game => {
 *   console.log(`${game.name}: ${game._count.participants} participants`);
 * });
 * ```
 */
export async function findAllWithCounts() {
  return prisma.game.findMany({
    include: {
      _count: {
        select: {
          participants: true,
        },
      },
      event: true,
      picks: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findById(id: string) {
  return prisma.game.findUnique({
    include: {
      event: true,
      picks: true,
    },
    where: { id },
  });
}

export async function findByEventId(eventId: string) {
  return prisma.game.findMany({
    include: {
      event: true,
      picks: true,
    },
    where: { eventId },
  });
}

export async function findByAccessCode(accessCode: string) {
  return prisma.game.findFirst({
    include: {
      event: true,
      picks: true,
    },
    where: { accessCode },
  });
}

export async function findByIdAndAccessCode(id: string, accessCode: string) {
  return prisma.game.findFirst({
    where: { id, accessCode },
    include: {
      event: true,
      picks: true,
    },
  });
}

export async function update(id: string, data: Prisma.GameUpdateInput) {
  return prisma.game.update({
    data,
    where: { id },
  });
}

export async function deleteById(id: string) {
  return prisma.game.delete({
    where: { id },
  });
}

/**
 * Complete a game by transitioning status to COMPLETED
 *
 * Sets game status to COMPLETED.
 * This method only performs the database update - business logic validation
 * (checking if game is LIVE, all categories revealed) should be done in the service layer.
 *
 * @param gameId - The game ID to complete
 * @returns Updated game with COMPLETED status
 *
 * @example
 * ```ts
 * await completeGame(gameId);
 * // Game now has: { status: 'COMPLETED' }
 * ```
 */
export async function completeGame(gameId: string) {
  return prisma.game.update({
    where: { id: gameId },
    data: {
      status: "COMPLETED",
    },
  });
}

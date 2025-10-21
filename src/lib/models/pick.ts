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

import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";

export async function create(data: { userId: string; gameId: string }) {
  return prisma.gameParticipant.create({
    data: {
      userId: data.userId,
      gameId: data.gameId,
    },
  });
}

export async function findByUserId(userId: string) {
  return prisma.gameParticipant.findMany({
    where: { userId },
    include: {
      game: {
        include: {
          event: true,
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });
}

export async function findByGameId(gameId: string) {
  return prisma.gameParticipant.findMany({
    where: { gameId },
    include: {
      user: true,
    },
    orderBy: {
      joinedAt: "asc",
    },
  });
}

export async function exists(userId: string, gameId: string) {
  const participant = await prisma.gameParticipant.findUnique({
    where: {
      userId_gameId: {
        userId,
        gameId,
      },
    },
  });
  return participant !== null;
}

export async function deleteByUserAndGame(userId: string, gameId: string) {
  return prisma.gameParticipant.delete({
    where: {
      userId_gameId: {
        userId,
        gameId,
      },
    },
  });
}

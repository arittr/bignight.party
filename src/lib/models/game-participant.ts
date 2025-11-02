import prisma from "@/lib/db/prisma";

export async function create(data: { userId: string; gameId: string }) {
  return prisma.gameParticipant.create({
    data: {
      gameId: data.gameId,
      userId: data.userId,
    },
  });
}

export async function findByUserId(userId: string) {
  return prisma.gameParticipant.findMany({
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
    where: { userId },
  });
}

export async function findByGameId(gameId: string) {
  return prisma.gameParticipant.findMany({
    include: {
      user: true,
    },
    orderBy: {
      joinedAt: "asc",
    },
    where: { gameId },
  });
}

export async function exists(userId: string, gameId: string) {
  const participant = await prisma.gameParticipant.findUnique({
    where: {
      userId_gameId: {
        gameId,
        userId,
      },
    },
  });
  return participant !== null;
}

export async function deleteByUserAndGame(userId: string, gameId: string) {
  return prisma.gameParticipant.delete({
    where: {
      userId_gameId: {
        gameId,
        userId,
      },
    },
  });
}

export async function getParticipantsCount(gameId: string) {
  return prisma.gameParticipant.count({
    where: { gameId },
  });
}

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
  return prisma.game.findUnique({
    include: {
      event: true,
      picks: true,
    },
    where: { accessCode },
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

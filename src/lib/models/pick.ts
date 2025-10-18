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

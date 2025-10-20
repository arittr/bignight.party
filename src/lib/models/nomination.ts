import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";

export async function create(data: Prisma.NominationCreateInput) {
  return prisma.nomination.create({
    data,
  });
}

export async function findAll() {
  return prisma.nomination.findMany({
    include: {
      category: true,
      person: true,
      work: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findById(id: string) {
  return prisma.nomination.findUnique({
    include: {
      category: true,
      person: true,
      work: true,
    },
    where: { id },
  });
}

export async function findByCategoryId(categoryId: string) {
  return prisma.nomination.findMany({
    include: {
      category: true,
      person: true,
      work: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    where: { categoryId },
  });
}

export async function update(id: string, data: Prisma.NominationUpdateInput) {
  return prisma.nomination.update({
    data,
    where: { id },
  });
}

export async function deleteById(id: string) {
  return prisma.nomination.delete({
    where: { id },
  });
}

// Alias for consistency with naming conventions in user-pick-wizard feature
export const getNominationsByCategoryId = findByCategoryId;

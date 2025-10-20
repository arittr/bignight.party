import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";

export async function create(data: Prisma.CategoryCreateInput) {
  return prisma.category.create({
    data,
  });
}

export async function findAll() {
  return prisma.category.findMany({
    include: {
      event: true,
      nominations: true,
    },
    orderBy: {
      order: "asc",
    },
  });
}

export async function findById(id: string) {
  return prisma.category.findUnique({
    include: {
      event: true,
      nominations: true,
    },
    where: { id },
  });
}

export async function findByEventId(eventId: string) {
  return prisma.category.findMany({
    include: {
      event: true,
      nominations: true,
    },
    orderBy: {
      order: "asc",
    },
    where: { eventId },
  });
}

export async function update(id: string, data: Prisma.CategoryUpdateInput) {
  return prisma.category.update({
    data,
    where: { id },
  });
}

export async function deleteById(id: string) {
  return prisma.category.delete({
    where: { id },
  });
}

// Alias for consistency with naming conventions in user-pick-wizard feature
export const getCategoriesByEventId = findByEventId;

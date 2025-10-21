import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";

export async function create(data: Prisma.PersonCreateInput) {
  return prisma.person.create({
    data,
  });
}

export async function findAll() {
  return prisma.person.findMany({
    include: {
      nominations: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Find all people with aggregated counts for admin list display
 * Returns nominations with workId to calculate distinct works count
 */
export async function findAllWithCounts() {
  return prisma.person.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      _count: {
        select: {
          nominations: true,
        },
      },
      id: true,
      imageUrl: true,
      name: true,
      nominations: {
        select: {
          workId: true,
        },
      },
    },
  });
}

export async function findById(id: string) {
  return prisma.person.findUnique({
    include: {
      nominations: true,
    },
    where: { id },
  });
}

export async function update(id: string, data: Prisma.PersonUpdateInput) {
  return prisma.person.update({
    data,
    where: { id },
  });
}

export async function deleteById(id: string) {
  return prisma.person.delete({
    where: { id },
  });
}

export async function findOrCreateByWikipediaSlug(data: {
  wikipediaSlug: string;
  name: string;
  imageUrl?: string;
}) {
  return await prisma.person.upsert({
    create: data,
    update: {},
    where: { wikipediaSlug: data.wikipediaSlug },
  });
}

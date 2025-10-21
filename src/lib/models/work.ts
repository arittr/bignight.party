import type { Prisma, WorkType } from "@prisma/client";
import prisma from "@/lib/db/prisma";

export async function create(data: Prisma.WorkCreateInput) {
  return prisma.work.create({
    data,
  });
}

export async function findAll() {
  return prisma.work.findMany({
    include: {
      nominations: true,
    },
    orderBy: {
      title: "asc",
    },
  });
}

export async function findById(id: string) {
  return prisma.work.findUnique({
    include: {
      nominations: true,
    },
    where: { id },
  });
}

export async function findByType(type: WorkType) {
  return prisma.work.findMany({
    include: {
      nominations: true,
    },
    orderBy: {
      title: "asc",
    },
    where: { type },
  });
}

export async function update(id: string, data: Prisma.WorkUpdateInput) {
  return prisma.work.update({
    data,
    where: { id },
  });
}

export async function deleteById(id: string) {
  return prisma.work.delete({
    where: { id },
  });
}

export async function findOrCreateByWikipediaSlug(data: {
  wikipediaSlug: string;
  title: string;
  type: WorkType;
  imageUrl?: string;
  year?: number;
}) {
  return await prisma.work.upsert({
    where: { wikipediaSlug: data.wikipediaSlug },
    update: {},
    create: data,
  });
}

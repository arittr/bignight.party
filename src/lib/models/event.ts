import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";

export async function create(data: Prisma.EventCreateInput) {
  return prisma.event.create({
    data,
  });
}

export async function findAll() {
  return prisma.event.findMany({
    include: {
      categories: true,
      games: true,
    },
    orderBy: {
      eventDate: "desc",
    },
  });
}

export async function findById(id: string) {
  return prisma.event.findUnique({
    include: {
      categories: true,
      games: true,
    },
    where: { id },
  });
}

export async function findBySlug(slug: string) {
  return prisma.event.findUnique({
    include: {
      categories: true,
      games: true,
    },
    where: { slug },
  });
}

export async function update(id: string, data: Prisma.EventUpdateInput) {
  return prisma.event.update({
    data,
    where: { id },
  });
}

export async function deleteById(id: string) {
  return prisma.event.delete({
    where: { id },
  });
}

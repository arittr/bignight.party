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

/**
 * Find all events with category counts
 *
 * Uses Prisma aggregation to fetch category counts without loading full category objects,
 * providing better performance for admin list pages that only need counts.
 *
 * @returns Events with games and category counts
 *
 * @example
 * ```tsx
 * const events = await eventModel.findAllWithCategoryCounts();
 * events.forEach(event => {
 *   console.log(`${event.name}: ${event._count.categories} categories`);
 * });
 * ```
 */
export async function findAllWithCategoryCounts() {
  return prisma.event.findMany({
    include: {
      _count: {
        select: {
          categories: true,
        },
      },
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

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

/**
 * Mark a winner for a category and reveal it atomically
 *
 * Sets both winnerNominationId and isRevealed = true in a single database operation.
 * This ensures atomicity - either both fields are set or neither are.
 *
 * @param categoryId - The category ID to mark winner for
 * @param nominationId - The nomination ID that won
 * @returns Updated category with winner marked
 *
 * @example
 * ```ts
 * await markWinner(categoryId, nominationId);
 * // Category now has: { isRevealed: true, winnerNominationId: nominationId }
 * ```
 */
export async function markWinner(categoryId: string, nominationId: string) {
  return prisma.category.update({
    where: { id: categoryId },
    data: {
      isRevealed: true,
      winnerNominationId: nominationId,
    },
  });
}

/**
 * Clear the winner for a category and unreveal it atomically
 *
 * Sets both winnerNominationId to null and isRevealed = false in a single database operation.
 * This ensures atomicity - either both fields are cleared or neither are.
 *
 * @param categoryId - The category ID to clear winner for
 * @returns Updated category with winner cleared
 *
 * @example
 * ```ts
 * await clearWinner(categoryId);
 * // Category now has: { isRevealed: false, winnerNominationId: null }
 * ```
 */
export async function clearWinner(categoryId: string) {
  return prisma.category.update({
    where: { id: categoryId },
    data: {
      isRevealed: false,
      winnerNominationId: null,
    },
  });
}

// Alias for consistency with naming conventions in user-pick-wizard feature
export const getCategoriesByEventId = findByEventId;

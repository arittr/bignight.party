import * as categoryModel from "@/lib/models/category";

/**
 * Mark a winner for a category
 * Sets the winnerNominationId and marks the category as revealed in a single operation
 *
 * @throws Error if nomination does not belong to the category
 */
export async function markWinner(categoryId: string, nominationId: string) {
  // Validate nomination belongs to category
  const category = await categoryModel.findById(categoryId);

  if (!category) {
    throw new Error(`Category with id ${categoryId} not found`);
  }

  const nominationBelongsToCategory = category.nominations.some((nom) => nom.id === nominationId);

  if (!nominationBelongsToCategory) {
    throw new Error(`Nomination ${nominationId} does not belong to category ${categoryId}`);
  }

  // Mark winner and reveal in one operation
  return categoryModel.update(categoryId, {
    isRevealed: true,
    winnerNominationId: nominationId,
  });
}

/**
 * Clear the winner for a category
 * Removes the winnerNominationId and unreveals the category in a single operation
 */
export async function clearWinner(categoryId: string) {
  return categoryModel.update(categoryId, {
    isRevealed: false,
    winnerNominationId: null,
  });
}

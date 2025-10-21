import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { routes } from "@/lib/routes";

export interface UsePickNavigationProps {
  gameId: string;
  categories: Array<{ id: string }>;
  currentCategoryId: string;
}

export interface UsePickNavigationReturn {
  currentCategoryId: string;
  navigateToCategory: (categoryId: string) => void;
  handlePrevious: () => void;
  handleNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  currentIndex: number;
}

/**
 * Custom hook for managing category navigation in the pick wizard
 *
 * Handles:
 * - Current category tracking
 * - Previous/next navigation
 * - Direct category selection
 * - Boundary detection (first/last category)
 *
 * Uses centralized routes from @/lib/routes per CLAUDE.md constitution.
 *
 * @param props - Game ID, categories array, and current category ID
 * @returns Navigation state and handlers
 */
export function usePickNavigation({
  gameId,
  categories,
  currentCategoryId,
}: UsePickNavigationProps): UsePickNavigationReturn {
  const router = useRouter();

  // Calculate current index and boundaries
  const currentIndex = useMemo(
    () => categories.findIndex((c) => c.id === currentCategoryId),
    [categories, currentCategoryId]
  );

  const hasPrevious = useMemo(() => currentIndex > 0, [currentIndex]);

  const hasNext = useMemo(
    () => currentIndex < categories.length - 1,
    [currentIndex, categories.length]
  );

  // Navigate to specific category using centralized routes
  const navigateToCategory = (categoryId: string) => {
    router.push(routes.game.pick(gameId, categoryId));
  };

  // Navigate to previous category
  const handlePrevious = () => {
    if (hasPrevious) {
      navigateToCategory(categories[currentIndex - 1].id);
    }
  };

  // Navigate to next category
  const handleNext = () => {
    if (hasNext) {
      navigateToCategory(categories[currentIndex + 1].id);
    }
  };

  return {
    currentCategoryId,
    currentIndex,
    handleNext,
    handlePrevious,
    hasNext,
    hasPrevious,
    navigateToCategory,
  };
}

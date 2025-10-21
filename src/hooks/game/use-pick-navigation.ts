import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export interface UsePickNavigationProps {
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
 * @param props - Categories array and current category ID
 * @returns Navigation state and handlers
 */
export function usePickNavigation({
  categories,
  currentCategoryId,
}: UsePickNavigationProps): UsePickNavigationReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Navigate to specific category by updating URL search params
  const navigateToCategory = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("category", categoryId);
    router.push(`?${params.toString()}`);
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

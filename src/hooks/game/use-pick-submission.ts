import { useEffect, useMemo, useState } from "react";
import { orpc } from "@/lib/api/client";

export interface UsePickSubmissionProps {
  gameId: string;
  currentCategoryId: string;
  existingPicks: Array<{
    categoryId: string;
    nominationId: string;
  }>;
  onSaving?: () => void;
  onSaved?: () => void;
  onError?: () => void;
}

export interface UsePickSubmissionReturn {
  selectedNominationId: string | null;
  handleSelect: (nominationId: string, isLocked: boolean) => void;
  completedCategoryIds: Set<string>;
  isSubmitting: boolean;
}

/**
 * Custom hook for managing pick submission with optimistic UI updates
 *
 * Handles:
 * - Pick selection state management
 * - Optimistic UI updates (immediate feedback)
 * - oRPC mutation execution
 * - Completed categories tracking
 *
 * @param props - Game ID, current category, existing picks, and callbacks
 * @returns Pick selection state and handlers
 */
export function usePickSubmission({
  gameId,
  currentCategoryId,
  existingPicks,
  onSaving,
  onSaved,
  onError,
}: UsePickSubmissionProps): UsePickSubmissionReturn {
  // Track selected nomination for current category
  const [selectedNominationId, setSelectedNominationId] = useState<string | null>(null);

  // Update selected nomination when category changes
  useEffect(() => {
    const existingPick = existingPicks.find((p) => p.categoryId === currentCategoryId);
    setSelectedNominationId(existingPick?.nominationId || null);
  }, [currentCategoryId, existingPicks]);

  // Submit pick mutation with callbacks
  const mutation = (orpc.pick.submitPick as any).useMutation?.({
    onError: (_error: any) => {
      onError?.();
    },
    onSuccess: () => {
      onSaved?.();
    },
  });

  // Handle nomination selection with optimistic UI update
  const handleSelect = (nominationId: string, isLocked: boolean) => {
    if (isLocked) return;

    // Optimistic update - show selection immediately
    setSelectedNominationId(nominationId);
    onSaving?.();

    // Submit to server
    mutation?.mutate({
      categoryId: currentCategoryId,
      gameId,
      nominationId,
    });
  };

  // Calculate completed categories
  const completedCategoryIds = useMemo(
    () => new Set(existingPicks.map((p) => p.categoryId)),
    [existingPicks]
  );

  return {
    completedCategoryIds,
    handleSelect,
    isSubmitting: mutation?.isPending ?? false,
    selectedNominationId,
  };
}

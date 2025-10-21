"use client";

import { useAction } from "next-safe-action/hooks";
import { useCallback, useState } from "react";
import { toast } from "@/components/admin/shared/toast";
import { createNominationAction, deleteNominationAction } from "@/lib/actions/admin-actions";

export interface NominationItem {
  id: string;
  personId?: string | null;
  workId?: string | null;
  person?: { name: string } | null;
  work?: { title: string } | null;
}

export interface UseNominationManagerOptions {
  categoryId: string;
  initialNominations: NominationItem[];
  maxNominations?: number;
}

export interface UseNominationManagerReturn {
  nominations: NominationItem[];
  isLoading: boolean;
  canAddMore: boolean;
  addNomination: (data: Record<string, unknown>) => Promise<void>;
  removeNomination: (id: string) => Promise<void>;
}

/**
 * Custom hook for managing nominations within a category
 *
 * Features:
 * - Add/remove nominations via server actions
 * - Validation (max nominations per category)
 * - Optimistic updates with revert on error
 * - Toast notifications
 * - Loading state management
 *
 * @param options - Configuration including category ID, initial nominations, and limits
 * @returns Nomination state and handlers
 *
 * @example
 * ```tsx
 * const { nominations, canAddMore, addNomination, removeNomination } = useNominationManager({
 *   categoryId: "cat-123",
 *   initialNominations: serverNominations,
 *   maxNominations: 10,
 * });
 *
 * const handleAdd = async (personId: string) => {
 *   await addNomination({ personId });
 * };
 *
 * const handleRemove = async (nominationId: string) => {
 *   await removeNomination(nominationId);
 * };
 * ```
 */
export function useNominationManager({
  categoryId,
  initialNominations,
  maxNominations = 10,
}: UseNominationManagerOptions): UseNominationManagerReturn {
  const [nominations, setNominations] = useState<NominationItem[]>(initialNominations);
  const [isLoading, setIsLoading] = useState(false);

  const createAction = useAction(createNominationAction);
  const deleteAction = useAction(deleteNominationAction);

  const canAddMore = nominations.length < maxNominations;

  const validateNominationData = useCallback((): boolean => {
    if (nominations.length >= maxNominations) {
      toast.error(`Maximum ${maxNominations} nominations allowed per category`);
      return false;
    }

    return true;
  }, [nominations.length, maxNominations]);

  const handleActionError = useCallback((error: unknown, fallbackMessage: string) => {
    const errorMessage = error instanceof Error ? error.message : fallbackMessage;
    toast.error(errorMessage);
    throw error;
  }, []);

  const executeAddNomination = useCallback(
    async (data: Record<string, unknown>) => {
      // Type assertion: data will be validated by the action's schema
      const result = await createAction.executeAsync({
        categoryId,
        ...data,
      } as never);

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      if (result?.validationErrors) {
        const errorMessage = Object.values(result.validationErrors).flat().join(", ");
        throw new Error(errorMessage);
      }

      if (result?.data) {
        const nomination = result.data;
        setNominations((prev) => [...prev, nomination]);
        toast.success("Nomination added successfully");
      }
    },
    [categoryId, createAction]
  );

  const addNomination = useCallback(
    async (data: Record<string, unknown>) => {
      if (!validateNominationData()) {
        return;
      }

      setIsLoading(true);

      try {
        await executeAddNomination(data);
      } catch (error) {
        handleActionError(error, "Failed to add nomination");
      } finally {
        setIsLoading(false);
      }
    },
    [validateNominationData, executeAddNomination, handleActionError]
  );

  const removeNomination = useCallback(
    async (id: string) => {
      setIsLoading(true);

      // Store original for revert
      const originalNominations = nominations;

      try {
        // Optimistic update
        setNominations((prev) => prev.filter((nom) => nom.id !== id));

        const result = await deleteAction.executeAsync({ id });

        if (result?.serverError) {
          throw new Error(result.serverError);
        }

        toast.success("Nomination removed successfully");
      } catch (error) {
        // Revert on error
        setNominations(originalNominations);

        const errorMessage = error instanceof Error ? error.message : "Failed to remove nomination";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [nominations, deleteAction]
  );

  return {
    addNomination,
    canAddMore,
    isLoading,
    nominations,
    removeNomination,
  };
}

"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "@/components/admin/shared/toast";
import { orpc } from "@/lib/api/client";

export interface CategoryOrderItem {
  id: string;
  name: string;
  order: number;
}

export interface UseCategoryOrderingOptions {
  initialCategories: CategoryOrderItem[];
  onOrderSaved?: () => void;
}

export interface UseCategoryOrderingReturn {
  categories: CategoryOrderItem[];
  isDirty: boolean;
  isSaving: boolean;
  reorder: (fromIndex: number, toIndex: number) => void;
  save: () => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for drag-and-drop category reordering with persistence
 *
 * Features:
 * - Local state for drag-and-drop reordering
 * - Dirty state tracking (has unsaved changes)
 * - Batch save to persist order via server action
 * - Optimistic updates with error handling
 * - Reset to original order
 *
 * @param options - Configuration including initial categories and callbacks
 * @returns Category state and reordering handlers
 *
 * @example
 * ```tsx
 * const { categories, isDirty, isSaving, reorder, save, reset } = useCategoryOrdering({
 *   initialCategories: serverCategories,
 *   onOrderSaved: () => router.refresh(),
 * });
 *
 * const handleDragEnd = (result: DropResult) => {
 *   if (!result.destination) return;
 *   reorder(result.source.index, result.destination.index);
 * };
 *
 * const handleSave = async () => {
 *   await save();
 * };
 * ```
 */
export function useCategoryOrdering({
  initialCategories,
  onOrderSaved,
}: UseCategoryOrderingOptions): UseCategoryOrderingReturn {
  const [categories, setCategories] = useState<CategoryOrderItem[]>(initialCategories);
  const [originalCategories] = useState<CategoryOrderItem[]>(initialCategories);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateCategoryMutation = useMutation(orpc.admin.updateCategory.mutationOptions());

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setCategories((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);

      // Update order for all items
      const reordered = result.map((item, index) => ({
        ...item,
        order: index,
      }));

      setIsDirty(true);
      return reordered;
    });
  }, []);

  const save = useCallback(async () => {
    setIsSaving(true);

    try {
      // Save each category's new order
      const updatePromises = categories.map((category) =>
        updateCategoryMutation.mutateAsync({
          id: category.id,
          order: category.order,
        })
      );

      await Promise.all(updatePromises);

      setIsDirty(false);
      toast.success("Category order saved successfully");

      if (onOrderSaved) {
        onOrderSaved();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save category order";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [categories, updateCategoryMutation, onOrderSaved]);

  const reset = useCallback(() => {
    setCategories(originalCategories);
    setIsDirty(false);
  }, [originalCategories]);

  return {
    categories,
    isDirty,
    isSaving,
    reorder,
    reset,
    save,
  };
}

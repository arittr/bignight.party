"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PickProgressTrackerProps {
  categories: Array<{
    id: string;
    name: string;
  }>;
  currentCategoryId: string;
  completedCategoryIds: Set<string>;
  onCategorySelect: (categoryId: string) => void;
}

/**
 * Horizontal stepper showing all categories with completion status
 *
 * Features:
 * - Horizontal layout with numbered steps
 * - Check icons for completed categories
 * - Highlights current category
 * - Direct category navigation on click
 * - Hidden on mobile (sidebar shown instead)
 *
 * This is a Client Component (needs onClick handlers).
 */
export function PickProgressTracker({
  categories,
  currentCategoryId,
  completedCategoryIds,
  onCategorySelect,
}: PickProgressTrackerProps) {
  return (
    <div className="hidden lg:block border-b bg-white p-4">
      <div className="flex items-center gap-2 overflow-x-auto">
        {categories.map((category, index) => {
          const isCompleted = completedCategoryIds.has(category.id);
          const isCurrent = category.id === currentCategoryId;

          return (
            <div className="flex items-center" key={category.id}>
              <Button
                className="flex items-center gap-2 px-4"
                onClick={() => onCategorySelect(category.id)}
                size="sm"
                variant={isCurrent ? "default" : isCompleted ? "secondary" : "outline"}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
                <span className="text-xs font-medium truncate max-w-32">{category.name}</span>
              </Button>

              {index < categories.length - 1 && (
                <div className="w-8 h-px bg-gray-300 mx-1 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

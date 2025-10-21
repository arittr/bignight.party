"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CategorySidebarProps {
  categories: Array<{
    id: string;
    name: string;
    pointValue: number;
  }>;
  currentCategoryId: string;
  completedCategoryIds: Set<string>;
  onCategorySelect: (categoryId: string) => void;
}

/**
 * Scrollable sidebar showing all categories with completion indicators
 *
 * Features:
 * - Scrollable list of categories
 * - Checkmark icons for completed categories
 * - Highlights current category
 * - Point values displayed for each category
 *
 * This is a Client Component (needs onClick handlers).
 */
export function CategorySidebar({
  categories,
  currentCategoryId,
  completedCategoryIds,
  onCategorySelect,
}: CategorySidebarProps) {
  return (
    <div className="h-full border-r bg-gray-50 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        <p className="text-sm text-gray-600">
          {completedCategoryIds.size} of {categories.length} completed
        </p>
      </div>

      <Separator className="mb-4" />

      <ScrollArea className="h-[calc(100%-5rem)]">
        <div className="space-y-2">
          {categories.map((category) => {
            const isCompleted = completedCategoryIds.has(category.id);
            const isCurrent = category.id === currentCategoryId;

            return (
              <Button
                className="w-full justify-between"
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                size="sm"
                variant={isCurrent ? "default" : "ghost"}
              >
                <span className="flex items-center gap-2 flex-1 text-left">
                  {isCompleted && <Check className="h-4 w-4 text-green-600" />}
                  <span className="truncate">{category.name}</span>
                </span>
                <span className="text-xs text-gray-500">{category.pointValue}pts</span>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

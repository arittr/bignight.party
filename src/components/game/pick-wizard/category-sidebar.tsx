"use client";

import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { routes } from "@/lib/routes";

interface CategorySidebarProps {
  categories: Array<{
    id: string;
    name: string;
    points: number;
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
    <div className="h-full border-r bg-gray-50 p-4 flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        <p className="text-sm text-gray-900">
          {completedCategoryIds.size} of {categories.length} completed
        </p>
      </div>

      <Separator className="mb-4" />

      <ScrollArea className="flex-1 mb-4">
        <div className="space-y-2">
          {categories.map((category) => {
            const isCompleted = completedCategoryIds.has(category.id);
            const isCurrent = category.id === currentCategoryId;

            return (
              <Button
                className={`w-full justify-between ${
                  isCurrent
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "text-gray-900 hover:text-gray-900"
                }`}
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                size="sm"
                variant={isCurrent ? "default" : "ghost"}
              >
                <span className="flex items-center gap-2 flex-1 text-left">
                  {isCompleted && <Check className="h-4 w-4 text-green-600" />}
                  <span className="truncate">{category.name}</span>
                </span>
                <span className="text-xs font-medium">{category.points}pts</span>
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      <Separator className="mb-4" />

      <Button
        asChild
        className="w-full text-gray-900 hover:text-gray-900"
        size="sm"
        variant="ghost"
      >
        <a href={routes.dashboard()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Games
        </a>
      </Button>
    </div>
  );
}

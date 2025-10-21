"use client";

import { GripVertical } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface CategoryListItem {
  id: string;
  name: string;
  points: number;
  order: number;
  nominationCount?: number;
}

export interface CategoryListProps {
  categories: CategoryListItem[];
  activeCategoryId?: string;
  onCategoryClick: (categoryId: string) => void;
  onReorder?: (categoryId: string, newOrder: number) => void;
  className?: string;
  ariaLabel?: string;
}

export function CategoryList({
  categories,
  activeCategoryId,
  onCategoryClick,
  onReorder,
  className,
  ariaLabel = "Category list",
}: CategoryListProps) {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  const sortedCategories = React.useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories]
  );

  const handleDragStart = (e: React.DragEvent<HTMLElement>, categoryId: string) => {
    setDraggedId(categoryId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>, categoryId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(categoryId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>, targetId: string) => {
    e.preventDefault();

    if (!draggedId || draggedId === targetId || !onReorder) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const draggedCategory = sortedCategories.find((c) => c.id === draggedId);
    const targetCategory = sortedCategories.find((c) => c.id === targetId);

    if (!draggedCategory || !targetCategory) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    // Call reorder with the target category's order
    onReorder(draggedId, targetCategory.order);

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, categoryId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCategoryClick(categoryId);
    }
  };

  const getCategoryClassName = (isActive: boolean, isDragging: boolean, isDragOver: boolean) => {
    return cn(
      "group flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 text-left text-card-foreground shadow transition-all",
      isActive && "border-primary bg-primary/5 ring-2 ring-primary",
      isDragging && "opacity-50",
      isDragOver && !isDragging && "border-primary border-dashed",
      !isActive && "hover:border-muted-foreground/50"
    );
  };

  const renderCategory = (category: CategoryListItem) => {
    const isActive = category.id === activeCategoryId;
    const isDragging = category.id === draggedId;
    const isDragOver = category.id === dragOverId;

    return (
      <button
        aria-label={`Category: ${category.name}, ${category.points} points`}
        aria-pressed={isActive}
        className={getCategoryClassName(isActive, isDragging, isDragOver)}
        draggable={Boolean(onReorder)}
        key={category.id}
        onClick={() => onCategoryClick(category.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, category.id)}
        onDragStart={(e) => handleDragStart(e, category.id)}
        onDrop={(e) => handleDrop(e, category.id)}
        onKeyDown={(e) => handleKeyDown(e, category.id)}
        type="button"
      >
        {onReorder && (
          <div
            aria-label="Drag to reorder"
            className="cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100"
            role="img"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{category.name}</span>
            <Badge variant={isActive ? "default" : "secondary"}>
              {category.points} {category.points === 1 ? "pt" : "pts"}
            </Badge>
          </div>
          {category.nominationCount !== undefined && (
            <span className="text-xs text-muted-foreground">
              {category.nominationCount}{" "}
              {category.nominationCount === 1 ? "nomination" : "nominations"}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <ScrollArea aria-label={ariaLabel} className="flex-1">
        <ul className="space-y-2 p-4">
          {sortedCategories.map((category) => (
            <li key={category.id}>{renderCategory(category)}</li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

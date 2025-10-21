"use client";

import { GripVertical } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  pointValue: number;
  sortOrder: number;
  _count: {
    nominations: number;
  };
}

interface Nomination {
  id: string;
  personId: string | null;
  workId: string | null;
  isWinner: boolean;
  person?: {
    name: string;
  } | null;
  work?: {
    title: string;
  } | null;
}

export interface EventDetailLayoutProps {
  categories: Category[];
  activeCategory: Category | null;
  nominations: Nomination[];
  onCategorySelect: (categoryId: string) => void;
  onCategoryReorder?: (categories: Category[]) => void;
  onAddCategory: () => void;
  onEditCategory?: (categoryId: string) => void;
  onAddNomination: () => void;
  className?: string;
}

interface CategoryItemProps {
  category: Category;
  index: number;
  isActive: boolean;
  isDragOver: boolean;
  isDraggable: boolean;
  onSelect: (categoryId: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}

function CategoryItem({
  category,
  index,
  isActive,
  isDragOver,
  isDraggable,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: CategoryItemProps) {
  return (
    <button
      aria-label={`Category: ${category.name}`}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors w-full text-left",
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
        isDragOver && "border-t-2 border-primary"
      )}
      draggable={isDraggable}
      onClick={() => onSelect(category.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      onDragStart={() => onDragStart(index)}
      onDrop={() => onDrop(index)}
      type="button"
    >
      {isDraggable && (
        <GripVertical
          aria-label="Drag to reorder"
          className="h-4 w-4 text-muted-foreground flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{category.name}</div>
        <div className="text-xs opacity-80">
          {category.pointValue} pts · {category._count.nominations} nominations
        </div>
      </div>
    </button>
  );
}

interface NominationListProps {
  activeCategory: Category | null;
  nominations: Nomination[];
}

function NominationList({ activeCategory, nominations }: NominationListProps) {
  if (!activeCategory) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Select a category to view nominations
      </div>
    );
  }

  if (nominations.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No nominations yet. Click Add to create one.
      </div>
    );
  }

  return (
    <>
      {nominations.map((nomination) => (
        <div
          className={cn(
            "p-3 rounded-md border",
            nomination.isWinner
              ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
              : "bg-card"
          )}
          key={nomination.id}
        >
          <div className="font-medium">
            {nomination.person?.name ?? nomination.work?.title ?? "Unknown"}
          </div>
          {nomination.isWinner && (
            <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Winner</div>
          )}
        </div>
      ))}
    </>
  );
}

export function EventDetailLayout({
  categories,
  activeCategory,
  nominations,
  onCategorySelect,
  onCategoryReorder,
  onAddCategory,
  onEditCategory,
  onAddNomination,
  className,
}: EventDetailLayoutProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null) return;

    const newCategories = [...categories];
    const [draggedItem] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(index, 0, draggedItem);

    const reorderedCategories = newCategories.map((cat, idx) => ({
      ...cat,
      sortOrder: idx,
    }));

    onCategoryReorder?.(reorderedCategories);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-[300px_1fr_400px] gap-4", className)}>
      {/* Sidebar: Category List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Categories</CardTitle>
            <Button
              aria-label="Add new category"
              onClick={onAddCategory}
              size="sm"
              variant="outline"
            >
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="space-y-1 px-3 pb-3">
              {categories.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No categories yet. Click Add to create one.
                </div>
              ) : (
                categories.map((category, index) => (
                  <CategoryItem
                    category={category}
                    index={index}
                    isActive={activeCategory?.id === category.id}
                    isDraggable={Boolean(onCategoryReorder)}
                    isDragOver={dragOverIndex === index}
                    key={category.id}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                    onSelect={onCategorySelect}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main: Active Category Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{activeCategory ? activeCategory.name : "Select a category"}</CardTitle>
              {activeCategory && (
                <p className="text-sm text-muted-foreground mt-1">
                  Point value: {activeCategory.pointValue}
                </p>
              )}
            </div>
            {activeCategory && onEditCategory && (
              <Button
                aria-label="Edit category"
                onClick={() => onEditCategory(activeCategory.id)}
                size="sm"
                variant="outline"
              >
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!activeCategory ? (
            <div className="text-center py-12 text-muted-foreground">
              Select a category from the sidebar to view details
            </div>
          ) : (
            <div className="space-y-4">
              <Separator />
              <div className="text-sm text-muted-foreground">
                This category has {nominations.length}{" "}
                {nominations.length === 1 ? "nomination" : "nominations"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Panel: Nominations */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Nominations</CardTitle>
            {activeCategory && (
              <Button
                aria-label="Add new nomination"
                onClick={onAddNomination}
                size="sm"
                variant="outline"
              >
                Add
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="space-y-2 px-3 pb-3">
              <NominationList activeCategory={activeCategory} nominations={nominations} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

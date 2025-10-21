"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WizardNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * Navigation buttons for moving between categories
 *
 * Features:
 * - Previous/Next buttons with chevron icons
 * - Disabled state at boundaries (first/last category)
 * - Responsive layout
 * - Visual feedback on hover
 *
 * This is a Client Component (needs onClick handlers).
 */
export function WizardNavigation({
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: WizardNavigationProps) {
  return (
    <div className="flex justify-between items-center gap-4 pt-6 border-t">
      <Button disabled={!hasPrevious} onClick={onPrevious} size="lg" variant="outline">
        <ChevronLeft className="h-5 w-5 mr-2" />
        Previous
      </Button>

      <Button disabled={!hasNext} onClick={onNext} size="lg" variant="default">
        Next
        <ChevronRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}

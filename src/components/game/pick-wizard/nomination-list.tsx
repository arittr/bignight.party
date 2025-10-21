"use client";

import { NomineeCard } from "@/components/nominee-card";

interface NominationListProps {
  nominations: Array<{
    id: string;
    nominationText: string;
    work?: {
      title: string;
      imageUrl: string | null;
      year: number | null;
    } | null;
    person?: {
      name: string;
      imageUrl: string | null;
    } | null;
  }>;
  selectedNominationId: string | null;
  onSelect: (nominationId: string) => void;
  isLocked: boolean;
}

/**
 * Responsive grid of nominee cards for the current category
 *
 * Features:
 * - Responsive grid layout (1 col mobile, 2 col tablet, 3 col desktop)
 * - Renders NomineeCard for each nomination
 * - Passes selection state and handlers to cards
 * - Supports locked state to prevent selection
 *
 * This is a Client Component (needs onClick handlers).
 */
export function NominationList({
  nominations,
  selectedNominationId,
  onSelect,
  isLocked,
}: NominationListProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {nominations.map((nomination) => (
        <NomineeCard
          isLocked={isLocked}
          isSelected={nomination.id === selectedNominationId}
          key={nomination.id}
          nomination={nomination}
          onClick={() => onSelect(nomination.id)}
        />
      ))}
    </div>
  );
}

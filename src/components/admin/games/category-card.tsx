"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { orpc } from "@/lib/api/client";

export interface NominationWithPickCount {
  id: string;
  nominationText: string;
  pickCount: number;
}

export interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    points: number;
    isRevealed: boolean;
    winnerNominationId: string | null;
  };
  nominations: NominationWithPickCount[];
}

/**
 * Client component for displaying a category with winner marking controls.
 * Shows nominations sorted by pick count with dropdown to mark winner and clear button.
 */
export function CategoryCard({ category, nominations }: CategoryCardProps) {
  const [selectedNominationId, setSelectedNominationId] = useState<string>(
    category.winnerNominationId ?? ""
  );

  const markWinnerMutation = useMutation(orpc.admin.markWinner.mutationOptions());
  const clearWinnerMutation = useMutation(orpc.admin.clearWinner.mutationOptions());

  const isLoading = markWinnerMutation.isPending || clearWinnerMutation.isPending;

  // Sort nominations by pick count descending
  const sortedNominations = [...nominations].sort((a, b) => b.pickCount - a.pickCount);

  // Find the current winner for display
  const currentWinner = nominations.find((nom) => nom.id === category.winnerNominationId);

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nominationId = e.target.value;
    if (nominationId && nominationId !== category.winnerNominationId) {
      setSelectedNominationId(nominationId);
      markWinnerMutation.mutate({ categoryId: category.id, nominationId });
    }
  };

  const handleClearWinner = () => {
    setSelectedNominationId("");
    clearWinnerMutation.mutate({ categoryId: category.id });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      {/* Category Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
          <span className="text-sm font-medium text-gray-500">{category.points} pts</span>
        </div>
        {category.isRevealed && (
          <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
            Revealed
          </span>
        )}
      </div>

      {/* Current Winner Display */}
      {currentWinner && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm font-medium text-green-800">
            Current: {currentWinner.nominationText} ✓
          </p>
        </div>
      )}

      {/* Nominations List (sorted by pick count) */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Nominations:</p>
        {sortedNominations.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No nominations for this category</p>
        ) : (
          <ul className="space-y-1">
            {sortedNominations.map((nomination) => (
              <li className="text-sm text-gray-600" key={nomination.id}>
                {nomination.nominationText} ({nomination.pickCount} picks)
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Winner Marking Controls */}
      <div className="space-y-3">
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor={`select-${category.id}`}
          >
            Mark Winner
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isLoading || sortedNominations.length === 0}
            id={`select-${category.id}`}
            onChange={handleDropdownChange}
            value={selectedNominationId}
          >
            <option value="">Select a winner...</option>
            {sortedNominations.map((nomination) => (
              <option key={nomination.id} value={nomination.id}>
                {nomination.nominationText}
              </option>
            ))}
          </select>
        </div>

        {category.winnerNominationId && (
          <button
            className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            onClick={handleClearWinner}
            type="button"
          >
            {clearWinnerMutation.isPending ? "Clearing..." : "Clear Winner"}
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">Updating...</p>
        </div>
      )}
    </div>
  );
}

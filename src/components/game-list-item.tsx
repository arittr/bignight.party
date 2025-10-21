// biome-ignore-all lint/style/useNamingConvention: Follow existing project conventions

"use client";

import type { GameStatus } from "@prisma/client";
import Link from "next/link";

interface GameListItemProps {
  game: {
    id: string;
    name: string;
    status: GameStatus;
    event: {
      name: string;
    };
  };
  picksCount: number;
  totalCategories: number;
}

const statusStyles: Record<GameStatus, string> = {
  COMPLETED: "bg-purple-100 text-purple-800",
  LIVE: "bg-blue-100 text-blue-800",
  OPEN: "bg-green-100 text-green-800",
  SETUP: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<GameStatus, string> = {
  COMPLETED: "Completed",
  LIVE: "Live",
  OPEN: "Open",
  SETUP: "Setup",
};

export function GameListItem({ game, picksCount, totalCategories }: GameListItemProps) {
  const isComplete = picksCount === totalCategories && totalCategories > 0;

  return (
    <Link
      className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-500 hover:shadow-md"
      href={`/game/${game.id}/pick`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{game.name}</h3>
          <p className="mt-1 text-sm text-gray-600">{game.event.name}</p>
        </div>
        <span
          className={`ml-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusStyles[game.status]}`}
        >
          {statusLabels[game.status]}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">{picksCount}</span>
            <span className="text-gray-500"> / {totalCategories}</span>
            <span className="ml-1 text-gray-500">categories</span>
          </div>
          {isComplete && (
            <svg
              className="h-5 w-5 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                fillRule="evenodd"
              />
            </svg>
          )}
        </div>

        <span className="text-sm font-medium text-indigo-600">
          {game.status === "OPEN" ? "Make picks →" : "View picks →"}
        </span>
      </div>
    </Link>
  );
}

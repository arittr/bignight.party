"use client";

import { joinGameAction } from "@/lib/actions/game-actions";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";

interface JoinGameButtonProps {
  gameId: string;
  gameName: string;
}

export function JoinGameButton({ gameId, gameName }: JoinGameButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { execute, isPending } = useAction(joinGameAction, {
    onSuccess: () => {
      router.push(`/game/${gameId}/pick`);
    },
    onError: ({ error }) => {
      console.error("Failed to join game:", error);
      setError(error.serverError || "Failed to join game. Please try again.");
    },
  });

  return (
    <div>
      <button
        onClick={() => execute({ gameId })}
        disabled={isPending}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        type="button"
      >
        {isPending ? "Joining..." : `Join ${gameName}`}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { orpc } from "@/lib/api/client";
import { routes } from "@/lib/routes";

interface JoinGameButtonProps {
  gameId: string;
  gameName: string;
}

export function JoinGameButton({ gameId, gameName }: JoinGameButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation(orpc.game.join.mutationOptions({
    onError: (err: any) => {
      setError(err?.message || "Failed to join game. Please try again.");
    },
    onSuccess: () => {
      router.push(routes.game.pick(gameId));
    },
  }));

  return (
    <div>
      <button
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        disabled={mutation?.isPending}
        onClick={() => mutation?.mutate({ gameId })}
        type="button"
      >
        {mutation?.isPending ? "Joining..." : `Join ${gameName}`}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

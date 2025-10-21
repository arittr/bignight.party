"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { joinGameAction, resolveAccessCodeAction } from "@/lib/actions/game-actions";

interface JoinGameHandlerProps {
  accessCode: string;
  userId: string;
}

export function JoinGameHandler({ accessCode }: JoinGameHandlerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [gameName, setGameName] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [shouldJoin, setShouldJoin] = useState(false);

  const { execute: resolveCode, status: resolveStatus } = useAction(resolveAccessCodeAction, {
    onError: () => {
      setError("Invalid invite code");
    },
    onSuccess: ({ data }) => {
      if (!data) {
        setError("Failed to resolve invite code");
        return;
      }

      const { gameId: resolvedGameId, isMember } = data;
      setGameId(resolvedGameId);

      // If already a member, just redirect
      if (isMember) {
        router.push(`/game/${resolvedGameId}/pick`);
        return;
      }

      // Otherwise, trigger join
      setShouldJoin(true);
    },
  });

  const { execute: joinGame, status: joinStatus } = useAction(joinGameAction, {
    onError: () => {
      setError("Failed to join game");
    },
    onSuccess: () => {
      setGameName("the game");
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    },
  });

  // Resolve the access code on mount
  useEffect(() => {
    resolveCode({ accessCode });
  }, [accessCode, resolveCode]);

  // Join the game once we have the gameId and shouldJoin is true
  useEffect(() => {
    if (shouldJoin && gameId) {
      joinGame({ gameId });
      setShouldJoin(false);
    }
  }, [shouldJoin, gameId, joinGame]);

  const isLoading = resolveStatus === "executing" || joinStatus === "executing";
  const hasSucceeded = joinStatus === "hasSucceeded";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {isLoading && !error && !hasSucceeded && (
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Joining game...</h2>
            <p className="mt-2 text-sm text-gray-600">Please wait while we add you to the game</p>
          </div>
        )}

        {hasSucceeded && gameName && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">You've joined {gameName}!</h2>
            <p className="mt-2 text-sm text-gray-600">Redirecting to your dashboard...</p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Failed to join game</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <button
              className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              onClick={() => router.push("/dashboard")}
              type="button"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { JoinGameInput } from "@/schemas/game-schema";
import { joinGameSchema } from "@/schemas/game-schema";
import { orpc } from "@/lib/api/client";
import { routes } from "@/lib/routes";

export function JoinGameForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinGameInput>({
    resolver: zodResolver(joinGameSchema),
  });

  const joinGame = useMutation(
    orpc.game.join.mutationOptions({
      onSuccess: (data) => {
        router.push(routes.game.pick(data.gameId));
      },
    })
  );

  const onSubmit = async (data: JoinGameInput) => {
    await joinGame.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Game ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="gameId">
          Game ID *
        </label>
        <input
          {...register("gameId")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          id="gameId"
          placeholder="clxxx123456789"
          type="text"
        />
        {errors.gameId && <p className="mt-1 text-sm text-red-600">{errors.gameId.message}</p>}
        <p className="mt-1 text-sm text-gray-500">The unique game ID provided by the game host</p>
      </div>

      {/* Access Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="accessCode">
          Access Code *
        </label>
        <input
          {...register("accessCode")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
          id="accessCode"
          placeholder="OSCARS2025"
          type="text"
        />
        {errors.accessCode && (
          <p className="mt-1 text-sm text-red-600">{errors.accessCode.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Uppercase letters and numbers only (will be auto-capitalized)
        </p>
      </div>

      {/* Error Message */}
      {joinGame.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            {joinGame.error instanceof Error ? joinGame.error.message : "Failed to join game"}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isSubmitting || joinGame.isPending}
        type="submit"
      >
        {isSubmitting || joinGame.isPending ? "Joining..." : "Join Game"}
      </button>
    </form>
  );
}

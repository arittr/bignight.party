"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { GameCreateInput } from "@/schemas/game-schema";
import { gameCreateSchema } from "@/schemas/game-schema";
import { orpc } from "@/lib/api/client";
import { routes } from "@/lib/routes";

interface CreateGameFormProps {
  events: Array<{
    id: string;
    name: string;
    eventDate: Date;
  }>;
}

export function CreateGameForm({ events }: CreateGameFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GameCreateInput>({
    resolver: zodResolver(gameCreateSchema),
  });

  const createGame = useMutation(
    orpc.admin.games.create.mutationOptions({
      onSuccess: () => {
        router.push(routes.admin.games.index());
      },
    })
  );

  const onSubmit = async (data: GameCreateInput) => {
    await createGame.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
          Name *
        </label>
        <input
          {...register("name")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          id="name"
          placeholder="Friends & Family Game"
          type="text"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {/* Event */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="eventId">
          Event *
        </label>
        <select
          {...register("eventId")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          id="eventId"
        >
          <option value="">Select an event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} ({new Date(event.eventDate).toLocaleDateString()})
            </option>
          ))}
        </select>
        {errors.eventId && <p className="mt-1 text-sm text-red-600">{errors.eventId.message}</p>}
      </div>

      {/* Access Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="accessCode">
          Access Code *
        </label>
        <input
          {...register("accessCode")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          id="accessCode"
          placeholder="OSCARS2025"
          type="text"
        />
        {errors.accessCode && (
          <p className="mt-1 text-sm text-red-600">{errors.accessCode.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">At least 4 characters, uppercase letters and numbers only</p>
      </div>

      {/* Picks Lock At */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="picksLockAt">
          Picks Lock At
        </label>
        <input
          {...register("picksLockAt")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          id="picksLockAt"
          type="datetime-local"
        />
        {errors.picksLockAt && (
          <p className="mt-1 text-sm text-red-600">{errors.picksLockAt.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          When should users no longer be able to make picks? Leave empty for no deadline.
        </p>
      </div>

      {/* Error Message */}
      {createGame.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            {createGame.error instanceof Error ? createGame.error.message : "Failed to create game"}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || createGame.isPending}
          type="submit"
        >
          {isSubmitting || createGame.isPending ? "Creating..." : "Create Game"}
        </button>
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          disabled={isSubmitting || createGame.isPending}
          onClick={() => router.push(routes.admin.games.index())}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

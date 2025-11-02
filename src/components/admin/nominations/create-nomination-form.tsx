"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { NominationCreateInput } from "@/schemas/nomination-schema";
import { nominationCreateSchema } from "@/schemas/nomination-schema";
import { orpc } from "@/lib/api/client";
import { routes } from "@/lib/routes";

interface CreateNominationFormProps {
  eventId: string;
  categoryId: string;
  categoryName: string;
  works: Array<{
    id: string;
    title: string;
    type: string;
    year: number | null;
  }>;
  people: Array<{
    id: string;
    name: string;
  }>;
}

export function CreateNominationForm({
  eventId,
  categoryId,
  categoryName,
  works,
  people,
}: CreateNominationFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NominationCreateInput>({
    resolver: zodResolver(nominationCreateSchema),
    defaultValues: {
      categoryId,
      nominationText: "",
      workId: undefined,
      personId: undefined,
    },
  });

  const createNomination = useMutation(
    orpc.admin.nominations.create.mutationOptions({
      onSuccess: () => {
        router.push(routes.admin.events.categories.detail(eventId, categoryId));
      },
    })
  );

  const onSubmit = async (data: NominationCreateInput) => {
    await createNomination.mutateAsync(data);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">New Nomination</h1>
      <p className="text-gray-600 mb-8">
        Create a nomination for: <strong>{categoryName}</strong>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Hidden categoryId field */}
        <input type="hidden" {...register("categoryId")} />

        {/* Nomination Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="nominationText">
            Nomination Text *
          </label>
          <input
            {...register("nominationText")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            id="nominationText"
            placeholder="e.g., Christopher Nolan for Oppenheimer"
            type="text"
          />
          {errors.nominationText && (
            <p className="mt-1 text-sm text-red-600">{errors.nominationText.message}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">Enter the display text for this nomination</p>
        </div>

        {/* Work Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="workId">
            Work (Optional)
          </label>
          <select
            {...register("workId")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            id="workId"
          >
            <option value="">-- Select Work --</option>
            {works.map((work) => (
              <option key={work.id} value={work.id}>
                {work.title} ({work.type}, {work.year})
              </option>
            ))}
          </select>
          {errors.workId && <p className="mt-1 text-sm text-red-600">{errors.workId.message}</p>}
          <p className="text-sm text-gray-500 mt-1">
            Optional: Select a work (film, TV show, etc.) for this nomination
          </p>
        </div>

        {/* Person Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="personId">
            Person (Optional)
          </label>
          <select
            {...register("personId")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            id="personId"
          >
            <option value="">-- Select Person --</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          {errors.personId && <p className="mt-1 text-sm text-red-600">{errors.personId.message}</p>}
          <p className="text-sm text-gray-500 mt-1">
            Optional: Select a person for this nomination
          </p>
        </div>

        {/* Warning Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> At least one of Work or Person must be selected. You can select
            both if the nomination involves both a work and a person.
          </p>
        </div>

        {/* Error Message */}
        {createNomination.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              {createNomination.error instanceof Error
                ? createNomination.error.message
                : "Failed to create nomination"}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || createNomination.isPending}
            type="submit"
          >
            {isSubmitting || createNomination.isPending ? "Creating..." : "Create Nomination"}
          </button>
          <button
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || createNomination.isPending}
            onClick={() => router.push(routes.admin.events.categories.detail(eventId, categoryId))}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

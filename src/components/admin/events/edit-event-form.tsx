"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { eventUpdateSchema } from "@/schemas/event-schema";
import { orpc } from "@/lib/api/client";

// Create a form schema without the ID field (we'll add it in onSubmit)
const editFormSchema = eventUpdateSchema.omit({ id: true });
type EditFormInput = z.infer<typeof editFormSchema>;

interface EditEventFormProps {
  event: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    eventDate: Date;
  };
}

export function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormInput>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: event.name,
      slug: event.slug,
      description: event.description || undefined,
      eventDate: new Date(event.eventDate).toISOString().slice(0, 16), // Format for datetime-local
    },
  });

  const updateEvent = useMutation(
    orpc.admin.events.update.mutationOptions({
      onSuccess: () => {
        router.refresh();
      },
    })
  );

  const onSubmit = async (data: EditFormInput) => {
    await updateEvent.mutateAsync({
      id: event.id,
      ...data,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
          Event Name *
        </label>
        <input
          {...register("name")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          id="name"
          placeholder="97th Academy Awards"
          type="text"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="slug">
          Slug *
        </label>
        <input
          {...register("slug")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          id="slug"
          placeholder="oscars-2025"
          type="text"
        />
        {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>}
        <p className="mt-1 text-sm text-gray-500">Lowercase letters, numbers, and hyphens only</p>
      </div>

      {/* Event Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="eventDate">
          Event Date *
        </label>
        <input
          {...register("eventDate")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          id="eventDate"
          type="datetime-local"
        />
        {errors.eventDate && (
          <p className="mt-1 text-sm text-red-600">{errors.eventDate.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">Date and time of the ceremony</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
          Description (Optional)
        </label>
        <textarea
          {...register("description")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          id="description"
          placeholder="Description of the event"
          rows={4}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Error Message */}
      {updateEvent.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            {updateEvent.error instanceof Error ? updateEvent.error.message : "Failed to update event"}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || updateEvent.isPending}
          type="submit"
        >
          {isSubmitting || updateEvent.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

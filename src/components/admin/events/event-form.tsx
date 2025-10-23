"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AdminForm } from "@/components/admin/ui/admin-form";
import { FormFieldGroup } from "@/components/admin/ui/form-field-group";
import { eventCreateSchema } from "@/schemas/event-schema";

// Use z.input type to handle coerce.date() properly
type EventFormData = z.input<typeof eventCreateSchema>;

export interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
  submitLabel?: string;
}

export function EventForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  submitLabel = "Save Event",
}: EventFormProps) {
  const form = useForm<EventFormData>({
    defaultValues: {
      description: initialData?.description ?? "",
      eventDate: initialData?.eventDate ?? new Date(),
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
    },
    resolver: zodResolver(eventCreateSchema),
  });

  return (
    <AdminForm
      ariaLabel="Event form"
      error={error}
      form={form}
      isLoading={isLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
    >
      <FormFieldGroup<EventFormData, "name">
        ariaLabel="Event name"
        label="Name"
        name="name"
        placeholder="97th Academy Awards"
        required
        type="text"
      />

      <FormFieldGroup<EventFormData, "slug">
        ariaLabel="Event slug"
        description="URL-friendly identifier (lowercase letters, numbers, and hyphens only)"
        label="Slug"
        name="slug"
        placeholder="oscars-2025"
        required
        type="text"
      />

      <FormFieldGroup<EventFormData, "eventDate">
        ariaLabel="Event date"
        description="Enter the date when the ceremony takes place"
        label="Event Date"
        name="eventDate"
        required
        type="date"
      />

      <FormFieldGroup<EventFormData, "description">
        ariaLabel="Event description"
        description="Optional description of the event"
        label="Description"
        name="description"
        placeholder="The 97th Academy Awards ceremony, presented by the Academy of Motion Picture Arts and Sciences..."
        rows={4}
        type="textarea"
      />
    </AdminForm>
  );
}

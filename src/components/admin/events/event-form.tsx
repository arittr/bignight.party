"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import type { z } from "zod";
import { AdminForm, AdminFormField } from "@/components/admin/ui/admin-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    resolver: zodResolver(eventCreateSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      eventDate: initialData?.eventDate ?? new Date(),
      description: initialData?.description ?? "",
    },
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
      <AdminFormField label="Name" name="name" required>
        {(field) => {
          const typedField = field as ControllerRenderProps<EventFormData, "name">;
          return (
            <Input
              {...typedField}
              aria-label="Event name"
              placeholder="97th Academy Awards"
              type="text"
            />
          );
        }}
      </AdminFormField>

      <AdminFormField
        description="URL-friendly identifier (lowercase letters, numbers, and hyphens only)"
        label="Slug"
        name="slug"
        required
      >
        {(field) => {
          const typedField = field as ControllerRenderProps<EventFormData, "slug">;
          return (
            <Input {...typedField} aria-label="Event slug" placeholder="oscars-2025" type="text" />
          );
        }}
      </AdminFormField>

      <AdminFormField
        description="Enter the date when the ceremony takes place"
        label="Event Date"
        name="eventDate"
        required
      >
        {(field) => {
          const typedField = field as ControllerRenderProps<EventFormData, "eventDate">;
          return (
            <Input
              aria-label="Event date"
              onChange={(e) => typedField.onChange(new Date(e.target.value))}
              type="date"
              value={
                typedField.value instanceof Date
                  ? typedField.value.toISOString().split("T")[0]
                  : String(typedField.value).split("T")[0]
              }
            />
          );
        }}
      </AdminFormField>

      <AdminFormField
        description="Optional description of the event"
        label="Description"
        name="description"
      >
        {(field) => {
          const typedField = field as ControllerRenderProps<EventFormData, "description">;
          return (
            <Textarea
              {...typedField}
              aria-label="Event description"
              placeholder="The 97th Academy Awards ceremony, presented by the Academy of Motion Picture Arts and Sciences..."
              rows={4}
            />
          );
        }}
      </AdminFormField>
    </AdminForm>
  );
}

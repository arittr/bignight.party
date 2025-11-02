"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AdminForm } from "@/components/admin/ui/admin-form";
import { FormFieldGroup } from "@/components/admin/ui/form-field-group";
import { personCreateSchema } from "@/schemas/person-schema";

// Use z.input type to handle nullable fields properly
type PersonFormData = z.input<typeof personCreateSchema>;

export interface PersonFormProps {
  initialData?: Partial<PersonFormData>;
  onSubmit: (data: PersonFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
  submitLabel?: string;
}

export function PersonForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  submitLabel = "Save Person",
}: PersonFormProps) {
  const form = useForm<PersonFormData>({
    defaultValues: {
      externalId: initialData?.externalId ?? "",
      imageUrl: initialData?.imageUrl ?? "",
      name: initialData?.name ?? "",
    },
    resolver: zodResolver(personCreateSchema),
  });

  return (
    <AdminForm
      ariaLabel="Person form"
      error={error}
      form={form}
      isLoading={isLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
    >
      <FormFieldGroup<PersonFormData, "name">
        ariaLabel="Person name"
        label="Name"
        name="name"
        placeholder="e.g., Christopher Nolan"
        required
        type="text"
      />

      <FormFieldGroup<PersonFormData, "imageUrl">
        ariaLabel="Person image URL"
        description="Optional URL to the person's photo or headshot"
        label="Image URL"
        name="imageUrl"
        placeholder="https://example.com/image.jpg"
        type="text"
      />

      <FormFieldGroup<PersonFormData, "externalId">
        ariaLabel="Person external ID"
        description="Optional external database ID (e.g., from TMDB or IMDB)"
        label="External ID"
        name="externalId"
        placeholder="e.g., tmdb:138"
        type="text"
      />
    </AdminForm>
  );
}

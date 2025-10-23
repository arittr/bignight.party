"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { WorkType } from "@prisma/client";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AdminForm } from "@/components/admin/ui/admin-form";
import { FormFieldGroup } from "@/components/admin/ui/form-field-group";
import { workCreateSchema } from "@/schemas/work-schema";

// Use z.input type to handle nullable fields properly
type WorkFormData = z.input<typeof workCreateSchema>;

export interface WorkFormProps {
  initialData?: Partial<WorkFormData>;
  onSubmit: (data: WorkFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
  submitLabel?: string;
}

const workTypeOptions = [
  { label: "Film", value: WorkType.FILM },
  { label: "TV Show", value: WorkType.TV_SHOW },
  { label: "Album", value: WorkType.ALBUM },
  { label: "Song", value: WorkType.SONG },
  { label: "Play", value: WorkType.PLAY },
  { label: "Book", value: WorkType.BOOK },
];

export function WorkForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  submitLabel = "Save Work",
}: WorkFormProps) {
  const form = useForm<WorkFormData>({
    defaultValues: {
      imageUrl: initialData?.imageUrl ?? "",
      title: initialData?.title ?? "",
      type: initialData?.type ?? WorkType.FILM,
      year: initialData?.year ?? undefined,
    },
    resolver: zodResolver(workCreateSchema),
  });

  return (
    <AdminForm
      ariaLabel="Work form"
      error={error}
      form={form}
      isLoading={isLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
    >
      <FormFieldGroup<WorkFormData, "title">
        ariaLabel="Work title"
        label="Title"
        name="title"
        placeholder="Enter work title"
        required
        type="text"
      />

      <FormFieldGroup<WorkFormData, "type">
        ariaLabel="Work type"
        description="Select the type of work"
        label="Type"
        name="type"
        options={workTypeOptions}
        required
        type="select"
      />

      <FormFieldGroup<WorkFormData, "year">
        ariaLabel="Work year"
        description="Year of release"
        label="Year"
        name="year"
        placeholder="Enter year"
        type="text"
      />

      <FormFieldGroup<WorkFormData, "imageUrl">
        ariaLabel="Work image URL"
        description="URL to work's image"
        label="Image URL"
        name="imageUrl"
        placeholder="https://example.com/image.jpg"
        type="text"
      />
    </AdminForm>
  );
}

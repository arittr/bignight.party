"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Work } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AdminForm } from "@/components/admin/ui/admin-form";
import { FormFieldGroup } from "@/components/admin/ui/form-field-group";
import { orpc } from "@/lib/api/client";
import { workUpdateSchema } from "@/schemas/work-schema";

type WorkFormData = z.infer<typeof workUpdateSchema>;

export interface EditWorkFormProps {
  work: Work;
}

export function EditWorkForm({ work }: EditWorkFormProps) {
  const router = useRouter();

  const form = useForm<WorkFormData>({
    defaultValues: {
      externalId: work.externalId ?? "",
      id: work.id,
      imageUrl: work.imageUrl ?? "",
      title: work.title,
      type: work.type,
      year: work.year ?? undefined,
    },
    resolver: zodResolver(workUpdateSchema),
  });

  const mutation = useMutation(orpc.admin.works.update.mutationOptions());

  const onSubmit = async (data: WorkFormData) => {
    await mutation.mutateAsync(data);
    router.refresh();
  };

  return (
    <AdminForm
      ariaLabel="Edit work form"
      error={mutation.error?.message}
      form={form}
      isLoading={mutation.isPending}
      onSubmit={onSubmit}
      submitLabel="Update Work"
    >
      <FormFieldGroup<WorkFormData, "title">
        ariaLabel="Work title"
        label="Title"
        name="title"
        placeholder="Enter work title"
        type="text"
      />

      <FormFieldGroup<WorkFormData, "type">
        ariaLabel="Work type"
        label="Type"
        name="type"
        options={[
          { label: "Film", value: "FILM" },
          { label: "TV Show", value: "TV_SHOW" },
          { label: "Album", value: "ALBUM" },
          { label: "Song", value: "SONG" },
          { label: "Play", value: "PLAY" },
          { label: "Book", value: "BOOK" },
          { label: "Other", value: "OTHER" },
        ]}
        placeholder="Select a type"
        type="select"
      />

      <FormFieldGroup<WorkFormData, "year">
        ariaLabel="Work year"
        description="Year the work was released (1900-2100)"
        label="Year"
        name="year"
        placeholder="Enter year"
        type="text"
      />

      <FormFieldGroup<WorkFormData, "imageUrl">
        ariaLabel="Poster URL"
        label="Poster URL"
        name="imageUrl"
        placeholder="https://example.com/poster.jpg"
        type="text"
      />

      <FormFieldGroup<WorkFormData, "externalId">
        ariaLabel="External ID"
        description="e.g., IMDB ID, ISBN, etc."
        label="External ID"
        name="externalId"
        placeholder="Enter external ID"
        type="text"
      />
    </AdminForm>
  );
}

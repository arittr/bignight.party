"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AdminForm } from "@/components/admin/ui/admin-form";
import { FormFieldGroup } from "@/components/admin/ui/form-field-group";
import { orpc } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import { workCreateSchema } from "@/schemas/work-schema";

type WorkFormData = z.infer<typeof workCreateSchema>;

export function CreateWorkForm() {
  const router = useRouter();

  const form = useForm<WorkFormData>({
    defaultValues: {
      externalId: "",
      imageUrl: "",
      title: "",
      type: "FILM",
      year: undefined,
    },
    resolver: zodResolver(workCreateSchema),
  });

  const mutation = useMutation(orpc.admin.works.create.mutationOptions());

  const onSubmit = async (data: WorkFormData) => {
    const result = await mutation.mutateAsync(data);
    router.push(routes.admin.works.detail(result.id));
  };

  return (
    <AdminForm
      ariaLabel="Create work form"
      error={mutation.error?.message}
      form={form}
      isLoading={mutation.isPending}
      onCancel={() => router.push(routes.admin.works.index())}
      onSubmit={onSubmit}
      submitLabel="Create Work"
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
        required
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

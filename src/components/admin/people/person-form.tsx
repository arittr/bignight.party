"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminForm } from "@/components/admin/ui/admin-form";
import { FormFieldGroup } from "@/components/admin/ui/form-field-group";

const personFormSchema = z.object({
  bio: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  name: z.string().min(1, "Name is required"),
  role: z.string().optional(),
});

export type PersonFormData = z.infer<typeof personFormSchema>;

export interface PersonFormProps {
  defaultValues?: Partial<PersonFormData>;
  onSubmit: (data: PersonFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
  submitLabel?: string;
  className?: string;
}

export function PersonForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  submitLabel = "Save Person",
  className,
}: PersonFormProps) {
  const form = useForm<PersonFormData>({
    defaultValues: {
      bio: defaultValues?.bio ?? "",
      imageUrl: defaultValues?.imageUrl ?? "",
      name: defaultValues?.name ?? "",
      role: defaultValues?.role ?? "",
    },
    resolver: zodResolver(personFormSchema),
  });

  return (
    <AdminForm
      ariaLabel="Person form"
      className={className}
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
        placeholder="Enter person's name"
        required
        type="text"
      />

      <FormFieldGroup<PersonFormData, "role">
        ariaLabel="Person role"
        description="e.g., Actor, Director, Producer"
        label="Role"
        name="role"
        placeholder="Enter person's role"
        type="text"
      />

      <FormFieldGroup<PersonFormData, "bio">
        ariaLabel="Person bio"
        description="Brief biography or description"
        label="Bio"
        name="bio"
        placeholder="Enter person's bio"
        rows={4}
        type="textarea"
      />

      <FormFieldGroup<PersonFormData, "imageUrl">
        ariaLabel="Person image URL"
        description="URL to person's image"
        label="Image URL"
        name="imageUrl"
        placeholder="https://example.com/image.jpg"
        type="text"
      />
    </AdminForm>
  );
}

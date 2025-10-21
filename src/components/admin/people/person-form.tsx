"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminForm, AdminFormField } from "@/components/admin/ui/admin-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
      <AdminFormField label="Name" name="name" required>
        {(field: unknown) => {
          const f = field as {
            value: string;
            onChange: (value: string) => void;
            onBlur: () => void;
          };
          return (
            <Input
              aria-label="Person name"
              onBlur={f.onBlur}
              onChange={(e) => f.onChange(e.target.value)}
              placeholder="Enter person's name"
              value={f.value}
            />
          );
        }}
      </AdminFormField>

      <AdminFormField description="e.g., Actor, Director, Producer" label="Role" name="role">
        {(field: unknown) => {
          const f = field as {
            value: string;
            onChange: (value: string) => void;
            onBlur: () => void;
          };
          return (
            <Input
              aria-label="Person role"
              onBlur={f.onBlur}
              onChange={(e) => f.onChange(e.target.value)}
              placeholder="Enter person's role"
              value={f.value}
            />
          );
        }}
      </AdminFormField>

      <AdminFormField description="Brief biography or description" label="Bio" name="bio">
        {(field: unknown) => {
          const f = field as {
            value: string;
            onChange: (value: string) => void;
            onBlur: () => void;
          };
          return (
            <Textarea
              aria-label="Person bio"
              onBlur={f.onBlur}
              onChange={(e) => f.onChange(e.target.value)}
              placeholder="Enter person's bio"
              rows={4}
              value={f.value}
            />
          );
        }}
      </AdminFormField>

      <AdminFormField description="URL to person's image" label="Image URL" name="imageUrl">
        {(field: unknown) => {
          const f = field as {
            value: string;
            onChange: (value: string) => void;
            onBlur: () => void;
          };
          return (
            <Input
              aria-label="Person image URL"
              onBlur={f.onBlur}
              onChange={(e) => f.onChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              type="url"
              value={f.value}
            />
          );
        }}
      </AdminFormField>
    </AdminForm>
  );
}

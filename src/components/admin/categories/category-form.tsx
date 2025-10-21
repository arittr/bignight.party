"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ControllerRenderProps } from "react-hook-form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminForm, AdminFormField } from "@/components/admin/ui/admin-form";
import { Input } from "@/components/ui/input";

export const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Name must be 100 characters or less"),
  order: z.number().int().min(0, "Order must be 0 or greater"),
  points: z
    .number()
    .int()
    .min(1, "Points must be at least 1")
    .max(100, "Points must be 100 or less"),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

export interface CategoryFormProps {
  initialData?: Partial<CategoryFormData>;
  onSubmit: (data: CategoryFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
  submitLabel?: string;
  className?: string;
  ariaLabel?: string;
}

export function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
  submitLabel = "Save Category",
  className,
  ariaLabel = "Category form",
}: CategoryFormProps) {
  const form = useForm<CategoryFormData>({
    defaultValues: {
      name: initialData?.name ?? "",
      order: initialData?.order ?? 0,
      points: initialData?.points ?? 1,
    },
    resolver: zodResolver(categoryFormSchema),
  });

  const handleSubmit = async (data: CategoryFormData) => {
    await onSubmit(data);
  };

  return (
    <AdminForm
      ariaLabel={ariaLabel}
      className={className}
      error={error}
      form={form}
      isLoading={isLoading}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel={submitLabel}
    >
      <AdminFormField label="Category Name" name="name" required>
        {(field) => {
          const typedField = field as ControllerRenderProps<CategoryFormData, "name">;
          return (
            <Input
              {...typedField}
              aria-label="Category name"
              placeholder="e.g., Best Picture, Best Actor"
              type="text"
              value={typedField.value}
            />
          );
        }}
      </AdminFormField>

      <AdminFormField
        description="Point value for this category (higher values indicate more important categories)"
        label="Points"
        name="points"
        required
      >
        {(field) => {
          const typedField = field as ControllerRenderProps<CategoryFormData, "points">;
          return (
            <Input
              {...typedField}
              aria-label="Point value"
              max={100}
              min={1}
              onChange={(e) => typedField.onChange(Number.parseInt(e.target.value, 10))}
              type="number"
              value={typedField.value}
            />
          );
        }}
      </AdminFormField>

      <AdminFormField
        description="Display order in the category list (0 = first)"
        label="Sort Order"
        name="order"
        required
      >
        {(field) => {
          const typedField = field as ControllerRenderProps<CategoryFormData, "order">;
          return (
            <Input
              {...typedField}
              aria-label="Sort order"
              min={0}
              onChange={(e) => typedField.onChange(Number.parseInt(e.target.value, 10))}
              type="number"
              value={typedField.value}
            />
          );
        }}
      </AdminFormField>
    </AdminForm>
  );
}

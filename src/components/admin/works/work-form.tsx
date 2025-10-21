"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { WorkType } from "@prisma/client";
import type * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminForm, AdminFormField } from "@/components/admin/ui/admin-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const workFormSchema = z.object({
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  title: z.string().min(1, "Title is required"),
  type: z.nativeEnum(WorkType),
  year: z
    .number()
    .int()
    .min(1800, "Year must be after 1800")
    .max(2100, "Year must be before 2100")
    .optional()
    .nullable(),
});

export type WorkFormData = z.infer<typeof workFormSchema>;

export interface WorkFormProps {
  defaultValues?: Partial<WorkFormData>;
  onSubmit: (data: WorkFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
  submitLabel?: string;
  className?: string;
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
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  submitLabel = "Save Work",
  className,
}: WorkFormProps) {
  const form = useForm<WorkFormData>({
    defaultValues: {
      description: defaultValues?.description ?? "",
      imageUrl: defaultValues?.imageUrl ?? "",
      title: defaultValues?.title ?? "",
      type: defaultValues?.type ?? WorkType.FILM,
      year: defaultValues?.year ?? null,
    },
    resolver: zodResolver(workFormSchema),
  });

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      form.setValue("year", null);
    } else {
      const numValue = Number.parseInt(value, 10);
      if (!Number.isNaN(numValue)) {
        form.setValue("year", numValue);
      }
    }
  };

  return (
    <AdminForm
      ariaLabel="Work form"
      className={className}
      error={error}
      form={form}
      isLoading={isLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
    >
      <AdminFormField label="Title" name="title" required>
        {(field: unknown) => {
          const f = field as {
            value: string;
            onChange: (value: string) => void;
            onBlur: () => void;
          };
          return (
            <Input
              aria-label="Work title"
              onBlur={f.onBlur}
              onChange={(e) => f.onChange(e.target.value)}
              placeholder="Enter work title"
              value={f.value}
            />
          );
        }}
      </AdminFormField>

      <AdminFormField description="Select the type of work" label="Type" name="type" required>
        {(field: unknown) => {
          const f = field as { value: WorkType; onChange: (value: WorkType) => void };
          return (
            <Select defaultValue={f.value} onValueChange={f.onChange}>
              <SelectTrigger aria-label="Work type">
                <SelectValue placeholder="Select work type" />
              </SelectTrigger>
              <SelectContent>
                {workTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }}
      </AdminFormField>

      <AdminFormField description="Year of release" label="Year" name="year">
        {() => (
          <Input
            aria-label="Work year"
            max={2100}
            min={1800}
            onChange={handleYearChange}
            placeholder="Enter year"
            type="number"
            value={form.watch("year") ?? ""}
          />
        )}
      </AdminFormField>

      <AdminFormField
        description="Brief description of the work"
        label="Description"
        name="description"
      >
        {(field: unknown) => {
          const f = field as {
            value: string;
            onChange: (value: string) => void;
            onBlur: () => void;
          };
          return (
            <Textarea
              aria-label="Work description"
              onBlur={f.onBlur}
              onChange={(e) => f.onChange(e.target.value)}
              placeholder="Enter work description"
              rows={4}
              value={f.value}
            />
          );
        }}
      </AdminFormField>

      <AdminFormField description="URL to work's image" label="Image URL" name="imageUrl">
        {(field: unknown) => {
          const f = field as {
            value: string;
            onChange: (value: string) => void;
            onBlur: () => void;
          };
          return (
            <Input
              aria-label="Work image URL"
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

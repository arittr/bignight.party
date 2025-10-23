"use client";

import type { ControllerRenderProps, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFormFieldRenderer } from "@/hooks/admin/use-form-field-renderer";
import { AdminFormField } from "./admin-form";

export type FieldType = "text" | "textarea" | "date" | "select";

export interface SelectOption {
  label: string;
  value: string;
}

export interface FormFieldGroupProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> {
  /**
   * Field name (must match form schema)
   */
  name: TName;

  /**
   * Field label
   */
  label?: string;

  /**
   * Field description (help text)
   */
  description?: string;

  /**
   * Field type (text, textarea, date, select)
   */
  type: FieldType;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Whether field is required
   */
  required?: boolean;

  /**
   * Options for select fields
   */
  options?: SelectOption[];

  /**
   * Number of rows for textarea fields
   */
  rows?: number;

  /**
   * Aria label for accessibility
   */
  ariaLabel?: string;
}

/**
 * FormFieldGroup wraps AdminFormField with type-safe renderers
 *
 * Eliminates the need for type casting by using useFormFieldRenderer hook
 * internally. Provides a simpler API for common form field types.
 *
 * @example
 * ```tsx
 * function EventForm() {
 *   const form = useForm<EventFormData>(...);
 *
 *   return (
 *     <AdminForm form={form} onSubmit={handleSubmit}>
 *       <FormFieldGroup<EventFormData, "name">
 *         name="name"
 *         label="Event Name"
 *         type="text"
 *         placeholder="97th Academy Awards"
 *         required
 *       />
 *
 *       <FormFieldGroup<EventFormData, "description">
 *         name="description"
 *         label="Description"
 *         type="textarea"
 *         rows={4}
 *       />
 *
 *       <FormFieldGroup<EventFormData, "eventDate">
 *         name="eventDate"
 *         label="Event Date"
 *         type="date"
 *         required
 *       />
 *
 *       <FormFieldGroup<EventFormData, "status">
 *         name="status"
 *         label="Status"
 *         type="select"
 *         options={[
 *           { label: "Draft", value: "DRAFT" },
 *           { label: "Published", value: "PUBLISHED" },
 *         ]}
 *       />
 *     </AdminForm>
 *   );
 * }
 * ```
 */
export function FormFieldGroup<TFieldValues extends FieldValues, TName extends Path<TFieldValues>>({
  name,
  label,
  description,
  type,
  placeholder,
  required,
  options = [],
  rows = 4,
  ariaLabel,
}: FormFieldGroupProps<TFieldValues, TName>) {
  const renderers = useFormFieldRenderer<TFieldValues>();

  return (
    <AdminFormField description={description} label={label} name={name} required={required}>
      {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Type switching logic for different field types */}
      {(field) => {
        // Type guard: Check that field is an object before accessing properties
        if (!field || typeof field !== "object") {
          throw new Error("Invalid field from AdminFormField");
        }

        // Now we can safely cast - AdminFormField guarantees this is ControllerRenderProps
        const typedField = field as ControllerRenderProps<TFieldValues, TName>;

        if (type === "text") {
          return (
            <Input
              {...renderers.text({ ariaLabel, field: typedField, placeholder })}
              placeholder={placeholder}
            />
          );
        }

        if (type === "textarea") {
          return (
            <Textarea
              {...renderers.textarea({ ariaLabel, field: typedField, placeholder })}
              placeholder={placeholder}
              rows={rows}
            />
          );
        }

        if (type === "date") {
          return (
            <Input
              {...renderers.date({ ariaLabel, field: typedField, placeholder })}
              placeholder={placeholder}
              type="date"
            />
          );
        }

        if (type === "select") {
          const selectProps = renderers.select({ ariaLabel, field: typedField, placeholder });

          return (
            <Select
              disabled={selectProps.disabled}
              name={selectProps.name}
              onValueChange={selectProps.onChange}
              value={selectProps.value as string}
            >
              <SelectTrigger ref={selectProps.ref}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        // Fallback (should never reach here due to TypeScript)
        return <Input {...typedField} />;
      }}
    </AdminFormField>
  );
}

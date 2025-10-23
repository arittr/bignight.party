"use client";

import { useCallback } from "react";
import type { ControllerRenderProps, FieldValues, Path } from "react-hook-form";

/**
 * Props for rendering different field types
 */
export interface FieldRendererProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> {
  /**
   * The react-hook-form field object (properly typed)
   */
  field: ControllerRenderProps<TFieldValues, TName>;

  /**
   * Optional aria-label for accessibility
   */
  ariaLabel?: string;

  /**
   * Optional placeholder text
   */
  placeholder?: string;
}

/**
 * Renderer functions for different field types
 */
export interface FieldRenderers<TFieldValues extends FieldValues> {
  /**
   * Render a text input field
   */
  text: <TName extends Path<TFieldValues>>(
    props: FieldRendererProps<TFieldValues, TName>
  ) => ControllerRenderProps<TFieldValues, TName>;

  /**
   * Render a textarea field
   */
  textarea: <TName extends Path<TFieldValues>>(
    props: FieldRendererProps<TFieldValues, TName>
  ) => ControllerRenderProps<TFieldValues, TName> & { rows?: number };

  /**
   * Render a date input field with proper Date handling
   */
  date: <TName extends Path<TFieldValues>>(
    props: FieldRendererProps<TFieldValues, TName>
  ) => {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    name: string;
    ref: React.Ref<HTMLInputElement>;
    disabled?: boolean;
  };

  /**
   * Render a select/dropdown field
   */
  select: <TName extends Path<TFieldValues>>(
    props: FieldRendererProps<TFieldValues, TName>
  ) => ControllerRenderProps<TFieldValues, TName>;
}

/**
 * Type guard to check if a value is a Date
 */
function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

/**
 * Convert a value to ISO date string for date inputs
 */
function toDateInputValue(value: unknown): string {
  if (isDate(value)) {
    return value.toISOString().split("T")[0];
  }
  if (typeof value === "string") {
    return value.split("T")[0];
  }
  return "";
}

/**
 * Custom hook for creating type-safe form field renderers
 *
 * Eliminates the need for type assertions (`as ControllerRenderProps`) in form components
 * by providing pre-typed renderer functions for common field types.
 *
 * @example
 * ```tsx
 * function EventForm() {
 *   const form = useForm<EventFormData>(...);
 *   const renderers = useFormFieldRenderer<EventFormData>();
 *
 *   return (
 *     <AdminFormField name="name" label="Name">
 *       {(field) => (
 *         <Input
 *           {...renderers.text({
 *             field: field as ControllerRenderProps<EventFormData, "name">,
 *             ariaLabel: "Event name",
 *             placeholder: "97th Academy Awards"
 *           })}
 *         />
 *       )}
 *     </AdminFormField>
 *   );
 * }
 * ```
 */
export function useFormFieldRenderer<
  TFieldValues extends FieldValues = FieldValues,
>(): FieldRenderers<TFieldValues> {
  const text = useCallback(
    <TName extends Path<TFieldValues>>({
      field,
    }: FieldRendererProps<TFieldValues, TName>): ControllerRenderProps<TFieldValues, TName> => {
      return field;
    },
    []
  );

  const textarea = useCallback(
    <TName extends Path<TFieldValues>>({ field }: FieldRendererProps<TFieldValues, TName>) => {
      return field;
    },
    []
  );

  const date = useCallback(
    <TName extends Path<TFieldValues>>({ field }: FieldRendererProps<TFieldValues, TName>) => {
      return {
        disabled: field.disabled,
        name: field.name,
        onBlur: field.onBlur,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          field.onChange(new Date(e.target.value));
        },
        ref: field.ref,
        value: toDateInputValue(field.value),
      };
    },
    []
  );

  const select = useCallback(
    <TName extends Path<TFieldValues>>({
      field,
    }: FieldRendererProps<TFieldValues, TName>): ControllerRenderProps<TFieldValues, TName> => {
      return field;
    },
    []
  );

  return {
    date,
    select,
    text,
    textarea,
  };
}

"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import type * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

export interface AdminFormProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  ariaLabel?: string;
}

export function AdminForm<T extends Record<string, unknown>>({
  form,
  onSubmit,
  children,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  onCancel,
  isLoading = false,
  error,
  className,
  ariaLabel = "Admin form",
}: AdminFormProps<T>) {
  return (
    <Form {...form}>
      <form
        aria-label={ariaLabel}
        className={cn("space-y-6", className)}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {error && (
          <Alert role="alert" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">{children}</div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button disabled={isLoading} onClick={onCancel} type="button" variant="outline">
              {cancelLabel}
            </Button>
          )}
          <Button disabled={isLoading} type="submit">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export interface AdminFormFieldProps {
  name: string;
  label?: string;
  description?: string;
  children: (field: unknown) => React.ReactNode;
  required?: boolean;
}

export function AdminFormField({
  name,
  label,
  description,
  children,
  required,
}: AdminFormFieldProps) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="ml-1 text-destructive">*</span>}
            </FormLabel>
          )}
          <FormControl>{children(field)}</FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

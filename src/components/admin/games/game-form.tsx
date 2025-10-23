"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Event } from "@prisma/client";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AdminForm, AdminFormField } from "@/components/admin/ui/admin-form";
import { FormFieldGroup } from "@/components/admin/ui/form-field-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gameCreateSchema } from "@/schemas/game-schema";

// Use z.input type to handle coerce properly
type GameFormData = z.input<typeof gameCreateSchema>;

export interface GameFormProps {
  events: Event[];
  initialData?: Partial<GameFormData>;
  onSubmit: (data: GameFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
  submitLabel?: string;
}

/**
 * Game creation/edit form with auto-generate access code functionality.
 * Validates inputs using Zod schema and integrates with next-safe-action.
 */
export function GameForm({
  events,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  submitLabel = "Save Game",
}: GameFormProps) {
  const form = useForm<GameFormData>({
    defaultValues: {
      accessCode: initialData?.accessCode ?? "",
      eventId: initialData?.eventId ?? "",
      name: initialData?.name ?? "",
      picksLockAt: initialData?.picksLockAt,
    },
    resolver: zodResolver(gameCreateSchema),
  });

  const generateAccessCode = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const length = 6;
    let code = "";
    for (let i = 0; i < length; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    form.setValue("accessCode", code);
  };

  return (
    <AdminForm
      ariaLabel="Game form"
      error={error}
      form={form}
      isLoading={isLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
    >
      <FormFieldGroup<GameFormData, "name">
        ariaLabel="Game name"
        label="Game Name"
        name="name"
        placeholder="e.g., Oscars 2025 - Friends Group"
        required
        type="text"
      />

      <FormFieldGroup<GameFormData, "eventId">
        ariaLabel="Event"
        label="Event"
        name="eventId"
        options={events.map((event) => ({
          label: `${event.name} - ${format(new Date(event.eventDate), "MMM d, yyyy")}`,
          value: event.id,
        }))}
        placeholder="Select an event"
        required
        type="select"
      />

      <AdminFormField
        description="Uppercase letters and numbers only. Click the button to auto-generate."
        label="Access Code"
        name="accessCode"
        required
      >
        {(field) => {
          const typedField = field as { value: string; onChange: (value: string) => void };
          return (
            <div className="flex gap-2">
              <Input
                aria-label="Access code"
                onChange={(e) => typedField.onChange(e.target.value)}
                placeholder="e.g., ABC123"
                value={typedField.value}
              />
              <Button
                aria-label="Generate random access code"
                onClick={generateAccessCode}
                type="button"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          );
        }}
      </AdminFormField>

      <AdminFormField
        description="When to lock picks before the ceremony starts"
        label="Picks Lock Time"
        name="picksLockAt"
      >
        {(field) => {
          const typedField = field as {
            value: Date | undefined;
            onChange: (value: Date | undefined) => void;
          };
          return (
            <Input
              aria-label="Picks lock time"
              onChange={(e) => {
                const value = e.target.value;
                typedField.onChange(value ? new Date(value) : undefined);
              }}
              type="datetime-local"
              value={
                typedField.value
                  ? format(new Date(typedField.value), "yyyy-MM-dd'T'HH:mm")
                  : ""
              }
            />
          );
        }}
      </AdminFormField>
    </AdminForm>
  );
}

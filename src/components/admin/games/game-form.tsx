"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Event } from "@prisma/client";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AdminForm, AdminFormField } from "@/components/admin/ui/admin-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gameCreateSchema } from "@/schemas/game-schema";

type GameFormInput = z.input<typeof gameCreateSchema>;

export interface GameFormProps {
  events: Event[];
  onSubmit: (data: z.infer<typeof gameCreateSchema>) => void | Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<GameFormInput>;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

/**
 * Game creation/edit form with auto-generate access code functionality.
 * Validates inputs using Zod schema and integrates with next-safe-action.
 */
export function GameForm({
  events,
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
  error,
  className,
}: GameFormProps) {
  const form = useForm<GameFormInput>({
    defaultValues: {
      accessCode: defaultValues?.accessCode ?? "",
      eventId: defaultValues?.eventId ?? "",
      name: defaultValues?.name ?? "",
      picksLockAt: defaultValues?.picksLockAt,
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

  const formatDateTimeLocal = (date: Date | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  const handleSubmit = (data: GameFormInput) => {
    // Schema will validate and transform the data, adding the default status if not provided
    onSubmit(data as z.infer<typeof gameCreateSchema>);
  };

  return (
    <AdminForm
      ariaLabel="Game form"
      cancelLabel="Cancel"
      className={className}
      error={error}
      form={form}
      isLoading={isLoading}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Save Game"
    >
      <AdminFormField label="Game Name" name="name" required>
        {(field) => {
          const typedField = field as { value: string; onChange: (value: string) => void };
          return (
            <Input
              aria-label="Game name"
              onChange={(e) => typedField.onChange(e.target.value)}
              placeholder="e.g., Oscars 2025 - Friends Group"
              value={typedField.value}
            />
          );
        }}
      </AdminFormField>

      <AdminFormField label="Event" name="eventId" required>
        {(field) => {
          const typedField = field as { value: string; onChange: (value: string) => void };
          return (
            <Select onValueChange={typedField.onChange} value={typedField.value}>
              <SelectTrigger aria-label="Select event">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} - {format(new Date(event.eventDate), "MMM d, yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }}
      </AdminFormField>

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
              value={formatDateTimeLocal(typedField.value)}
            />
          );
        }}
      </AdminFormField>
    </AdminForm>
  );
}

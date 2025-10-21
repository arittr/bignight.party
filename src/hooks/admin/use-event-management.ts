"use client";

import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/admin/shared/toast";
import {
  createEventAction,
  deleteEventAction,
  updateEventAction,
} from "@/lib/actions/admin-actions";

export interface EventListItem {
  id: string;
  name: string;
  eventDate: Date;
  categoryCount?: number;
}

export interface UseEventManagementOptions {
  initialEvents?: EventListItem[];
}

export interface UseEventManagementReturn {
  events: EventListItem[];
  isLoading: boolean;
  createEvent: (data: Record<string, unknown>) => Promise<void>;
  updateEvent: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  refreshEvents: (newEvents: EventListItem[]) => void;
}

/**
 * Custom hook for event CRUD operations with optimistic updates
 *
 * Features:
 * - Event list state management
 * - Create/update/delete operations via server actions
 * - Optimistic updates for immediate UI feedback
 * - Automatic revert on error
 * - Toast notifications for all operations
 *
 * @param options - Configuration including initial events
 * @returns Event state and CRUD handlers
 *
 * @example
 * ```tsx
 * const { events, createEvent, updateEvent, deleteEvent } = useEventManagement({
 *   initialEvents: serverEvents,
 * });
 *
 * const handleCreate = async (data: EventInput) => {
 *   await createEvent(data);
 * };
 *
 * const handleDelete = async (id: string) => {
 *   await deleteEvent(id);
 * };
 * ```
 */
export function useEventManagement({
  initialEvents = [],
}: UseEventManagementOptions = {}): UseEventManagementReturn {
  const [events, setEvents] = useState<EventListItem[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);

  const createAction = useAction(createEventAction);
  const updateAction = useAction(updateEventAction);
  const deleteAction = useAction(deleteEventAction);

  // Sync with initial events when they change
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const handleActionError = useCallback((error: unknown, fallbackMessage: string) => {
    const errorMessage = error instanceof Error ? error.message : fallbackMessage;
    toast.error(errorMessage);
    throw error;
  }, []);

  const createEvent = useCallback(
    async (data: Record<string, unknown>) => {
      setIsLoading(true);

      try {
        // Type assertion: data will be validated by the action's schema
        const result = await createAction.executeAsync(data as never);

        if (result?.serverError) {
          throw new Error(result.serverError);
        }

        if (result?.validationErrors) {
          const errorMessage = Object.values(result.validationErrors).flat().join(", ");
          throw new Error(errorMessage);
        }

        if (result?.data) {
          const event = result.data;
          setEvents((prev) => [
            ...prev,
            {
              categoryCount: 0,
              eventDate: event.eventDate,
              id: event.id,
              name: event.name,
            },
          ]);

          toast.success("Event created successfully");
        }
      } catch (error) {
        handleActionError(error, "Failed to create event");
      } finally {
        setIsLoading(false);
      }
    },
    [createAction, handleActionError]
  );

  const updateEvent = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      setIsLoading(true);

      // Store original for revert
      const originalEvents = events;

      try {
        // Optimistic update
        setEvents((prev) =>
          prev.map((event) =>
            event.id === id
              ? {
                  ...event,
                  ...(data as Partial<EventListItem>),
                }
              : event
          )
        );

        // Type assertion: data will be validated by the action's schema
        const result = await updateAction.executeAsync({ id, ...data } as never);

        if (result?.serverError) {
          throw new Error(result.serverError);
        }

        if (result?.validationErrors) {
          const errorMessage = Object.values(result.validationErrors).flat().join(", ");
          throw new Error(errorMessage);
        }

        toast.success("Event updated successfully");
      } catch (error) {
        // Revert on error
        setEvents(originalEvents);

        const errorMessage = error instanceof Error ? error.message : "Failed to update event";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [events, updateAction]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      setIsLoading(true);

      // Store original for revert
      const originalEvents = events;

      try {
        // Optimistic update
        setEvents((prev) => prev.filter((event) => event.id !== id));

        const result = await deleteAction.executeAsync({ id });

        if (result?.serverError) {
          throw new Error(result.serverError);
        }

        toast.success("Event deleted successfully");
      } catch (error) {
        // Revert on error
        setEvents(originalEvents);

        const errorMessage = error instanceof Error ? error.message : "Failed to delete event";
        toast.error(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [events, deleteAction]
  );

  const refreshEvents = useCallback((newEvents: EventListItem[]) => {
    setEvents(newEvents);
  }, []);

  return {
    createEvent,
    deleteEvent,
    events,
    isLoading,
    refreshEvents,
    updateEvent,
  };
}

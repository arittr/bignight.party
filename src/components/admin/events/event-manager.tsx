"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { toast } from "@/components/admin/shared/toast";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { EventList } from "./event-list";

interface EventListItem {
  id: string;
  name: string;
  slug: string;
  eventDate: Date;
  description: string | null;
  _count: {
    categories: number;
  };
}

export interface EventManagerProps {
  events: EventListItem[];
  onDelete?: (eventId: string) => Promise<void>;
}

export function EventManager({ events, onDelete }: EventManagerProps) {
  const router = useRouter();
  const [filterValue, setFilterValue] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [eventToDelete, setEventToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const filteredEvents = React.useMemo(() => {
    if (!filterValue) return events;

    const lowerFilter = filterValue.toLowerCase();
    return events.filter(
      (event) =>
        event.name.toLowerCase().includes(lowerFilter) ||
        event.slug.toLowerCase().includes(lowerFilter)
    );
  }, [events, filterValue]);

  const handleView = (eventId: string) => {
    router.push(routes.admin.events.detail(eventId));
  };

  const handleEdit = (eventId: string) => {
    router.push(routes.admin.events.detail(eventId));
  };

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(eventToDelete);
      toast.success("Event deleted successfully");
      setDeleteDialogOpen(false);
      setEventToDelete(null);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete event", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = () => {
    router.push(routes.admin.events.new());
  };

  const handleImport = () => {
    router.push(routes.admin.import());
  };

  if (events.length === 0) {
    return (
      <div>
        <AdminPageHeader
          breadcrumbs={[
            { href: routes.admin.index(), label: "Admin" },
            { href: routes.admin.events.index(), label: "Events" },
          ]}
          description="Manage awards shows and ceremonies"
          title="Events"
        />
        <AdminEmptyState
          message="Events represent awards ceremonies like the Oscars or Golden Globes. Create your first event to get started."
          primaryAction={{
            label: "Create Event",
            onClick: handleCreate,
          }}
          secondaryAction={{
            label: "Import Event",
            onClick: handleImport,
          }}
          title="No events yet"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <div className="flex gap-2">
            <Button
              aria-label="Import event from Wikipedia"
              onClick={handleImport}
              variant="outline"
            >
              Import Event
            </Button>
            <Button aria-label="Create new event" onClick={handleCreate}>
              Create Event
            </Button>
          </div>
        }
        breadcrumbs={[
          { href: routes.admin.index(), label: "Admin" },
          { href: routes.admin.events.index(), label: "Events" },
        ]}
        description="Manage awards shows and ceremonies"
        title="Events"
      />

      <EventList
        events={filteredEvents}
        filterValue={filterValue}
        onDelete={handleDeleteClick}
        onEdit={handleEdit}
        onFilterChange={setFilterValue}
        onView={handleView}
      />

      <ConfirmDialog
        confirmLabel="Delete"
        description="This will permanently delete the event and all associated categories and nominations. This action cannot be undone."
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Delete Event?"
        variant="destructive"
      />
    </div>
  );
}

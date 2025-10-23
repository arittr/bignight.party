"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { toast } from "@/components/admin/shared/toast";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import type { ResourceItem } from "@/hooks/admin/use-resource-manager";
import { useResourceManager } from "@/hooks/admin/use-resource-manager";
import { routes } from "@/lib/routes";
import { EventList } from "./event-list";

interface EventListItem extends ResourceItem {
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
  const manager = useResourceManager(
    {
      onDelete: onDelete
        ? async (eventId: string) => {
            try {
              await onDelete(eventId);
              toast.success("Event deleted successfully");
            } catch (error) {
              toast.error("Failed to delete event", {
                description:
                  error instanceof Error ? error.message : "An unexpected error occurred",
              });
              throw error;
            }
          }
        : undefined,
      resources: events,
      searchFields: ["name", "slug"],
    },
    {
      createRoute: routes.admin.events.new(),
      deleteSuccessMessage: "Event deleted successfully",
      editRoute: routes.admin.events.detail,
      viewRoute: routes.admin.events.detail,
    }
  );

  const handleImport = () => {
    router.push(routes.admin.import());
  };

  if (manager.isEmpty) {
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
            onClick: manager.handleCreate,
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
            <Button aria-label="Create new event" onClick={manager.handleCreate}>
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
        events={manager.filteredResources}
        filterValue={manager.filterValue}
        onDelete={manager.handleDeleteClick}
        onEdit={manager.handleEdit}
        onFilterChange={manager.setFilterValue}
        onView={manager.handleView}
      />

      <ConfirmDialog
        confirmLabel="Delete"
        description="This will permanently delete the event and all associated categories and nominations. This action cannot be undone."
        isLoading={manager.isDeleting}
        onConfirm={manager.handleDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) {
            manager.handleDeleteCancel();
          }
        }}
        open={manager.deleteDialogOpen}
        title="Delete Event?"
        variant="destructive"
      />
    </div>
  );
}

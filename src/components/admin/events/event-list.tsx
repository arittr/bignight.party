"use client";

import {
  AdminTable,
  type AdminTableColumn,
  type AdminTableRowAction,
} from "@/components/admin/ui/admin-table";
import { Badge } from "@/components/ui/badge";

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

export interface EventListProps {
  events: EventListItem[];
  onView: (eventId: string) => void;
  onEdit: (eventId: string) => void;
  onDelete: (eventId: string) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
}

export function EventList({
  events,
  onView,
  onEdit,
  onDelete,
  filterValue,
  onFilterChange,
}: EventListProps) {
  const columns: AdminTableColumn<EventListItem>[] = [
    {
      key: "name",
      label: "Name",
      render: (event) => (
        <div>
          <div className="font-medium">{event.name}</div>
          {event.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">{event.description}</div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: "slug",
      label: "Slug",
      render: (event) => (
        <code className="text-sm bg-muted px-1.5 py-0.5 rounded">{event.slug}</code>
      ),
      sortable: true,
    },
    {
      key: "eventDate",
      label: "Date",
      render: (event) => (
        <div className="text-sm">
          {new Date(event.eventDate).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      ),
      sortable: true,
    },
    {
      key: "categories",
      label: "Categories",
      render: (event) => (
        <Badge variant="secondary">
          {event._count.categories} {event._count.categories === 1 ? "category" : "categories"}
        </Badge>
      ),
      sortable: true,
    },
  ];

  const rowActions: AdminTableRowAction<EventListItem>[] = [
    {
      label: "View",
      onClick: (event) => onView(event.id),
      variant: "default",
    },
    {
      label: "Edit",
      onClick: (event) => onEdit(event.id),
      variant: "default",
    },
    {
      label: "Delete",
      onClick: (event) => onDelete(event.id),
      variant: "destructive",
    },
  ];

  return (
    <AdminTable
      ariaLabel="Events list"
      columns={columns}
      data={events}
      emptyState={
        <div className="text-center py-8">
          <p className="text-muted-foreground">No events found.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first event to get started.
          </p>
        </div>
      }
      filterPlaceholder="Filter events by name or slug..."
      filterValue={filterValue}
      onFilterChange={onFilterChange}
      rowActions={rowActions}
    />
  );
}

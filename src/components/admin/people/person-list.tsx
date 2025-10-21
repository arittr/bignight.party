"use client";

import * as React from "react";
import type { AdminTableColumn, AdminTableRowAction } from "@/components/admin/ui/admin-table";
import { AdminTable } from "@/components/admin/ui/admin-table";

export interface PersonListItem {
  id: string;
  name: string;
  role?: string | null;
  worksCount: number;
  nominationsCount: number;
}

export interface PersonListProps {
  people: PersonListItem[];
  onView?: (person: PersonListItem) => void;
  onEdit?: (person: PersonListItem) => void;
  onDelete?: (person: PersonListItem) => void;
  className?: string;
}

export function PersonList({ people, onView, onEdit, onDelete, className }: PersonListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredPeople = React.useMemo(() => {
    if (!searchQuery) return people;
    const query = searchQuery.toLowerCase();
    return people.filter((person) => person.name.toLowerCase().includes(query));
  }, [people, searchQuery]);

  const columns: AdminTableColumn<PersonListItem>[] = [
    {
      key: "name",
      label: "Name",
      render: (person) => (
        <div>
          <div className="font-medium">{person.name}</div>
          {person.role && <div className="text-sm text-muted-foreground">{person.role}</div>}
        </div>
      ),
      sortable: true,
    },
    {
      key: "worksCount",
      label: "Works",
      render: (person) => person.worksCount,
      sortable: true,
    },
    {
      key: "nominationsCount",
      label: "Nominations",
      render: (person) => person.nominationsCount,
      sortable: false,
    },
  ];

  const rowActions: AdminTableRowAction<PersonListItem>[] = [];
  if (onView) {
    rowActions.push({
      label: "View",
      onClick: onView,
    });
  }
  if (onEdit) {
    rowActions.push({
      label: "Edit",
      onClick: onEdit,
    });
  }
  if (onDelete) {
    rowActions.push({
      label: "Delete",
      onClick: onDelete,
      variant: "destructive",
    });
  }

  return (
    <AdminTable
      ariaLabel="People list"
      className={className}
      columns={columns}
      data={filteredPeople}
      emptyState="No people found. Create your first person to get started."
      filterPlaceholder="Search by name..."
      filterValue={searchQuery}
      onFilterChange={setSearchQuery}
      rowActions={rowActions.length > 0 ? rowActions : undefined}
    />
  );
}

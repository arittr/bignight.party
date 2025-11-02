"use client";

import type { WorkType } from "@prisma/client";
import * as React from "react";
import type { AdminTableColumn, AdminTableRowAction } from "@/components/admin/ui/admin-table";
import { AdminTable } from "@/components/admin/ui/admin-table";
import { Badge } from "@/components/ui/badge";

export interface WorkListItem {
  id: string;
  title: string;
  type: WorkType;
  year: number | null;
  nominationsCount: number;
  [key: string]: unknown;
}

export interface WorkListProps {
  works: WorkListItem[];
  onView?: (workId: string) => void;
  onEdit?: (workId: string) => void;
  onDelete?: (workId: string) => void;
  typeFilter?: WorkType | null;
  className?: string;
}

const workTypeLabels: Record<WorkType, string> = {
  // biome-ignore lint/style/useNamingConvention: Matches WorkType enum
  ALBUM: "Album",
  // biome-ignore lint/style/useNamingConvention: Matches WorkType enum
  BOOK: "Book",
  // biome-ignore lint/style/useNamingConvention: Matches WorkType enum
  FILM: "Film",
  // biome-ignore lint/style/useNamingConvention: Matches WorkType enum
  PLAY: "Play",
  // biome-ignore lint/style/useNamingConvention: Matches WorkType enum
  SONG: "Song",
  // biome-ignore lint/style/useNamingConvention: Matches WorkType enum
  TV_SHOW: "TV Show",
  // biome-ignore lint/style/useNamingConvention: Matches WorkType enum
  OTHER: "Other",
};

export function WorkList({
  works,
  onView,
  onEdit,
  onDelete,
  typeFilter,
  className,
}: WorkListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredWorks = React.useMemo(() => {
    let filtered = works;

    if (typeFilter) {
      filtered = filtered.filter((work) => work.type === typeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((work) => work.title.toLowerCase().includes(query));
    }

    return filtered;
  }, [works, typeFilter, searchQuery]);

  const columns: AdminTableColumn<WorkListItem>[] = [
    {
      key: "title",
      label: "Title",
      render: (work) => work.title,
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      render: (work) => <Badge variant="outline">{workTypeLabels[work.type]}</Badge>,
      sortable: false,
    },
    {
      key: "year",
      label: "Year",
      render: (work) => work.year ?? "—",
      sortable: true,
    },
    {
      key: "nominationsCount",
      label: "Nominations",
      render: (work) => work.nominationsCount,
      sortable: false,
    },
  ];

  const rowActions: AdminTableRowAction<WorkListItem>[] = [];
  if (onView) {
    rowActions.push({
      label: "View",
      onClick: (work) => onView(work.id),
    });
  }
  if (onEdit) {
    rowActions.push({
      label: "Edit",
      onClick: (work) => onEdit(work.id),
    });
  }
  if (onDelete) {
    rowActions.push({
      label: "Delete",
      onClick: (work) => onDelete(work.id),
      variant: "destructive",
    });
  }

  return (
    <AdminTable
      ariaLabel="Works list"
      className={className}
      columns={columns}
      data={filteredWorks}
      emptyState="No works found. Create your first work to get started."
      filterPlaceholder="Search by title..."
      filterValue={searchQuery}
      onFilterChange={setSearchQuery}
      rowActions={rowActions.length > 0 ? rowActions : undefined}
    />
  );
}

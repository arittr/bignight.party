"use client";

import type { Event, Game } from "@prisma/client";
import { format } from "date-fns";
import {
  AdminTable,
  type AdminTableColumn,
  type AdminTableRowAction,
} from "@/components/admin/ui/admin-table";
import { GameStatusBadge } from "./game-status-badge";

export interface GameWithRelations extends Game {
  event: Event;
  _count?: {
    participants: number;
  };
}

export interface GameListProps {
  games: GameWithRelations[];
  onView: (game: GameWithRelations) => void;
  onEdit: (game: GameWithRelations) => void;
  onDelete: (game: GameWithRelations) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  className?: string;
}

/**
 * Game list table with status badges, filtering, and row actions.
 * Displays games with event info, status, participants count, and picks lock time.
 */
export function GameList({
  games,
  onView,
  onEdit,
  onDelete,
  filterValue,
  onFilterChange,
  className,
}: GameListProps) {
  const columns: AdminTableColumn<GameWithRelations>[] = [
    {
      key: "name",
      label: "Game Name",
      render: (game) => game.name,
      sortable: true,
    },
    {
      key: "event",
      label: "Event",
      render: (game) => game.event.name,
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (game) => <GameStatusBadge status={game.status} />,
      sortable: true,
    },
    {
      key: "participants",
      label: "Participants",
      render: (game) => game._count?.participants ?? 0,
      sortable: true,
    },
    {
      key: "picksLockAt",
      label: "Picks Lock Time",
      render: (game) =>
        game.picksLockAt ? format(new Date(game.picksLockAt), "MMM d, yyyy h:mm a") : "Not set",
      sortable: true,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (game) => format(new Date(game.createdAt), "MMM d, yyyy"),
      sortable: true,
    },
  ];

  const rowActions: AdminTableRowAction<GameWithRelations>[] = [
    {
      label: "View",
      onClick: onView,
    },
    {
      label: "Edit",
      onClick: onEdit,
    },
    {
      label: "Delete",
      onClick: onDelete,
      variant: "destructive",
    },
  ];

  return (
    <AdminTable
      ariaLabel="Games table"
      className={className}
      columns={columns}
      data={games}
      emptyState="No games found. Create your first game to get started."
      filterPlaceholder="Filter games by name or event..."
      filterValue={filterValue}
      onFilterChange={onFilterChange}
      rowActions={rowActions}
    />
  );
}

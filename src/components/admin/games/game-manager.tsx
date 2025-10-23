"use client";

import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { toast } from "@/components/admin/shared/toast";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import type { ResourceItem } from "@/hooks/admin/use-resource-manager";
import { useResourceManager } from "@/hooks/admin/use-resource-manager";
import { routes } from "@/lib/routes";
import { GameList, type GameWithRelations } from "./game-list";

interface GameListItem extends ResourceItem {
  name: string;
  accessCode: string;
  status: "SETUP" | "OPEN" | "LIVE" | "COMPLETED";
  picksLockAt: Date | null;
  event: {
    id: string;
    name: string;
  };
  _count?: {
    participants: number;
  };
}

export interface GameManagerProps {
  games: GameWithRelations[];
  onDelete?: (gameId: string) => Promise<void>;
}

export function GameManager({ games, onDelete }: GameManagerProps) {
  const manager = useResourceManager(
    {
      onDelete: onDelete
        ? async (gameId: string) => {
            try {
              await onDelete(gameId);
              toast.success("Game deleted successfully");
            } catch (error) {
              toast.error("Failed to delete game", {
                description:
                  error instanceof Error ? error.message : "An unexpected error occurred",
              });
              throw error;
            }
          }
        : undefined,
      resources: games,
      searchFields: ["name", "accessCode"],
    },
    {
      createRoute: routes.admin.games.new(),
      deleteSuccessMessage: "Game deleted successfully",
      editRoute: routes.admin.games.detail,
      viewRoute: routes.admin.games.detail,
    }
  );

  if (manager.isEmpty) {
    return (
      <div>
        <AdminPageHeader
          breadcrumbs={[
            { href: routes.admin.index(), label: "Admin" },
            { href: routes.admin.games.index(), label: "Games" },
          ]}
          description="Manage prediction games for awards shows"
          title="Games"
        />
        <AdminEmptyState
          message="Games allow users to make predictions for awards shows. Create your first game to get started."
          primaryAction={{
            label: "Create Game",
            onClick: manager.handleCreate,
          }}
          title="No games yet"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <Button aria-label="Create new game" onClick={manager.handleCreate}>
            Create Game
          </Button>
        }
        breadcrumbs={[
          { href: routes.admin.index(), label: "Admin" },
          { href: routes.admin.games.index(), label: "Games" },
        ]}
        description="Manage prediction games for awards shows"
        title="Games"
      />

      <GameList
        filterValue={manager.filterValue}
        games={manager.filteredResources}
        onDelete={manager.handleDeleteClick}
        onEdit={manager.handleEdit}
        onFilterChange={manager.setFilterValue}
        onView={manager.handleView}
      />

      <ConfirmDialog
        confirmLabel="Delete"
        description="This will permanently delete the game and all associated picks and participants. This action cannot be undone."
        isLoading={manager.isDeleting}
        onConfirm={manager.handleDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) {
            manager.handleDeleteCancel();
          }
        }}
        open={manager.deleteDialogOpen}
        title="Delete Game?"
        variant="destructive"
      />
    </div>
  );
}

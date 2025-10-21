"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { toast } from "@/components/admin/shared/toast";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { GameList, type GameWithRelations } from "./game-list";

export interface GameManagerProps {
  games: GameWithRelations[];
  onDelete?: (gameId: string) => Promise<void>;
}

export function GameManager({ games, onDelete }: GameManagerProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [gameToDelete, setGameToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleView = (game: GameWithRelations) => {
    router.push(routes.admin.games.detail(game.id));
  };

  const handleEdit = (game: GameWithRelations) => {
    router.push(routes.admin.games.detail(game.id));
  };

  const handleDeleteClick = (game: GameWithRelations) => {
    setGameToDelete(game.id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gameToDelete || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(gameToDelete);
      toast.success("Game deleted successfully");
      setDeleteDialogOpen(false);
      setGameToDelete(null);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete game", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = () => {
    router.push(routes.admin.games.new());
  };

  if (games.length === 0) {
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
            onClick: handleCreate,
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
          <Button aria-label="Create new game" onClick={handleCreate}>
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
        games={games}
        onDelete={handleDeleteClick}
        onEdit={handleEdit}
        onView={handleView}
      />

      <ConfirmDialog
        confirmLabel="Delete"
        description="This will permanently delete the game and all associated picks and participants. This action cannot be undone."
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Delete Game?"
        variant="destructive"
      />
    </div>
  );
}

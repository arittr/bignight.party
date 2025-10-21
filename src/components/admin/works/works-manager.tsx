"use client";

import type { WorkType } from "@prisma/client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { toast } from "@/components/admin/shared/toast";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { WorkList, type WorkListItem } from "./work-list";

export interface WorksManagerProps {
  works: WorkListItem[];
  typeFilter?: WorkType | null;
  onDelete?: (workId: string) => Promise<void>;
}

export function WorksManager({ works, typeFilter, onDelete }: WorksManagerProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [workToDelete, setWorkToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleView = (work: WorkListItem) => {
    router.push(routes.admin.works.detail(work.id));
  };

  const handleEdit = (work: WorkListItem) => {
    router.push(routes.admin.works.detail(work.id));
  };

  const handleDeleteClick = (work: WorkListItem) => {
    setWorkToDelete(work.id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!workToDelete || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(workToDelete);
      toast.success("Work deleted successfully");
      setDeleteDialogOpen(false);
      setWorkToDelete(null);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete work", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = () => {
    router.push(routes.admin.works.new());
  };

  if (works.length === 0) {
    return (
      <div>
        <AdminPageHeader
          breadcrumbs={[
            { href: routes.admin.index(), label: "Admin" },
            { href: routes.admin.works.index(), label: "Works" },
          ]}
          description="Manage films, TV shows, albums, and other creative works"
          title="Works"
        />
        <AdminEmptyState
          message="Works represent films, TV shows, albums, and other creative content. Create your first work to get started."
          primaryAction={{
            label: "Create Work",
            onClick: handleCreate,
          }}
          title="No works yet"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <Button aria-label="Create new work" onClick={handleCreate}>
            Create Work
          </Button>
        }
        breadcrumbs={[
          { href: routes.admin.index(), label: "Admin" },
          { href: routes.admin.works.index(), label: "Works" },
        ]}
        description="Manage films, TV shows, albums, and other creative works"
        title="Works"
      />

      <WorkList
        onDelete={handleDeleteClick}
        onEdit={handleEdit}
        onView={handleView}
        typeFilter={typeFilter}
        works={works}
      />

      <ConfirmDialog
        confirmLabel="Delete"
        description="This will permanently delete the work and all associated nominations. This action cannot be undone."
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Delete Work?"
        variant="destructive"
      />
    </div>
  );
}

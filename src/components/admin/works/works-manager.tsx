"use client";

import type { WorkType } from "@prisma/client";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { toast } from "@/components/admin/shared/toast";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { useResourceManager } from "@/hooks/admin/use-resource-manager";
import { routes } from "@/lib/routes";
import { WorkList, type WorkListItem } from "./work-list";

export interface WorksManagerProps {
  works: WorkListItem[];
  typeFilter?: WorkType | null;
  onDelete?: (workId: string) => Promise<void>;
}

export function WorksManager({ works, typeFilter, onDelete }: WorksManagerProps) {
  const manager = useResourceManager(
    {
      onDelete: onDelete
        ? async (workId: string) => {
            try {
              await onDelete(workId);
              toast.success("Work deleted successfully");
            } catch (error) {
              toast.error("Failed to delete work", {
                description:
                  error instanceof Error ? error.message : "An unexpected error occurred",
              });
              throw error;
            }
          }
        : undefined,
      resources: works,
      searchFields: ["title"],
    },
    {
      createRoute: routes.admin.works.new(),
      deleteSuccessMessage: "Work deleted successfully",
      editRoute: routes.admin.works.detail,
      viewRoute: routes.admin.works.detail,
    }
  );

  if (manager.isEmpty) {
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
            onClick: manager.handleCreate,
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
          <Button aria-label="Create new work" onClick={manager.handleCreate}>
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
        onDelete={manager.handleDeleteClick}
        onEdit={manager.handleEdit}
        onView={manager.handleView}
        typeFilter={typeFilter}
        works={manager.filteredResources}
      />

      <ConfirmDialog
        confirmLabel="Delete"
        description="This will permanently delete the work and all associated nominations. This action cannot be undone."
        isLoading={manager.isDeleting}
        onConfirm={manager.handleDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) {
            manager.handleDeleteCancel();
          }
        }}
        open={manager.deleteDialogOpen}
        title="Delete Work?"
        variant="destructive"
      />
    </div>
  );
}

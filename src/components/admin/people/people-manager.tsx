"use client";

import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { toast } from "@/components/admin/shared/toast";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { useResourceManager } from "@/hooks/admin/use-resource-manager";
import { routes } from "@/lib/routes";
import { PersonList, type PersonListItem } from "./person-list";

export interface PeopleManagerProps {
  people: PersonListItem[];
  onDelete?: (personId: string) => Promise<void>;
}

export function PeopleManager({ people, onDelete }: PeopleManagerProps) {
  const manager = useResourceManager(
    {
      onDelete: onDelete
        ? async (personId: string) => {
            try {
              await onDelete(personId);
              toast.success("Person deleted successfully");
            } catch (error) {
              toast.error("Failed to delete person", {
                description:
                  error instanceof Error ? error.message : "An unexpected error occurred",
              });
              throw error;
            }
          }
        : undefined,
      resources: people,
      searchFields: ["name"],
    },
    {
      createRoute: routes.admin.people.new(),
      deleteSuccessMessage: "Person deleted successfully",
      editRoute: routes.admin.people.detail,
      viewRoute: routes.admin.people.detail,
    }
  );

  if (manager.isEmpty) {
    return (
      <div>
        <AdminPageHeader
          breadcrumbs={[
            { href: routes.admin.index(), label: "Admin" },
            { href: routes.admin.people.index(), label: "People" },
          ]}
          description="Manage actors, directors, and other industry professionals"
          title="People"
        />
        <AdminEmptyState
          message="People represent actors, directors, producers, and other professionals. Create your first person to get started."
          primaryAction={{
            label: "Create Person",
            onClick: manager.handleCreate,
          }}
          title="No people yet"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <Button aria-label="Create new person" onClick={manager.handleCreate}>
            Create Person
          </Button>
        }
        breadcrumbs={[
          { href: routes.admin.index(), label: "Admin" },
          { href: routes.admin.people.index(), label: "People" },
        ]}
        description="Manage actors, directors, and other industry professionals"
        title="People"
      />

      <PersonList
        filterValue={manager.filterValue}
        onDelete={manager.handleDeleteClick}
        onEdit={manager.handleEdit}
        onFilterChange={manager.setFilterValue}
        onView={manager.handleView}
        people={manager.filteredResources}
      />

      <ConfirmDialog
        confirmLabel="Delete"
        description="This will permanently delete the person and all associated nominations. This action cannot be undone."
        isLoading={manager.isDeleting}
        onConfirm={manager.handleDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) {
            manager.handleDeleteCancel();
          }
        }}
        open={manager.deleteDialogOpen}
        title="Delete Person?"
        variant="destructive"
      />
    </div>
  );
}

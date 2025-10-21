"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { toast } from "@/components/admin/shared/toast";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { PersonList, type PersonListItem } from "./person-list";

export interface PeopleManagerProps {
  people: PersonListItem[];
  onDelete?: (personId: string) => Promise<void>;
}

export function PeopleManager({ people, onDelete }: PeopleManagerProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [personToDelete, setPersonToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleView = (person: PersonListItem) => {
    router.push(routes.admin.people.detail(person.id));
  };

  const handleEdit = (person: PersonListItem) => {
    router.push(routes.admin.people.detail(person.id));
  };

  const handleDeleteClick = (person: PersonListItem) => {
    setPersonToDelete(person.id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!personToDelete || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(personToDelete);
      toast.success("Person deleted successfully");
      setDeleteDialogOpen(false);
      setPersonToDelete(null);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete person", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = () => {
    router.push(routes.admin.people.new());
  };

  if (people.length === 0) {
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
            onClick: handleCreate,
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
          <Button aria-label="Create new person" onClick={handleCreate}>
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
        onDelete={handleDeleteClick}
        onEdit={handleEdit}
        onView={handleView}
        people={people}
      />

      <ConfirmDialog
        confirmLabel="Delete"
        description="This will permanently delete the person and all associated nominations. This action cannot be undone."
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Delete Person?"
        variant="destructive"
      />
    </div>
  );
}

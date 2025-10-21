"use client";

import { Edit, Plus, Trash2 } from "lucide-react";
import type { AdminTableColumn } from "@/components/admin/ui/admin-table";
import { AdminTable } from "@/components/admin/ui/admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface NominationItem {
  id: string;
  personName?: string;
  workTitle?: string;
  isWinner?: boolean;
}

export interface CategoryDetailData {
  id: string;
  name: string;
  points: number;
  order: number;
  isRevealed: boolean;
  nominations: NominationItem[];
}

export interface CategoryDetailLayoutProps {
  category: CategoryDetailData;
  onEdit: () => void;
  onDelete: () => void;
  onAddNomination: () => void;
  onEditNomination?: (nominationId: string) => void;
  onDeleteNomination?: (nominationId: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function CategoryDetailLayout({
  category,
  onEdit,
  onDelete,
  onAddNomination,
  onEditNomination,
  onDeleteNomination,
  className,
  ariaLabel = "Category details",
}: CategoryDetailLayoutProps) {
  const columns: AdminTableColumn<NominationItem>[] = [
    {
      key: "nominee",
      label: "Nominee",
      render: (item) => (
        <div className="flex items-center gap-2">
          <span>{item.personName || item.workTitle || "Unknown"}</span>
          {item.isWinner && (
            <Badge className="ml-2" variant="default">
              Winner
            </Badge>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      render: (item) => <Badge variant="secondary">{item.personName ? "Person" : "Work"}</Badge>,
      sortable: true,
    },
  ];

  const rowActions = [
    ...(onEditNomination
      ? [
          {
            label: "Edit",
            onClick: (item: NominationItem) => onEditNomination(item.id),
          },
        ]
      : []),
    ...(onDeleteNomination
      ? [
          {
            label: "Delete",
            onClick: (item: NominationItem) => onDeleteNomination(item.id),
            variant: "destructive" as const,
          },
        ]
      : []),
  ];

  return (
    <section aria-label={ariaLabel} className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>{category.name}</CardTitle>
              <CardDescription>
                {category.points} {category.points === 1 ? "point" : "points"} • Order:{" "}
                {category.order}
                {category.isRevealed && (
                  <Badge className="ml-2" variant="default">
                    Revealed
                  </Badge>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                aria-label={`Edit category ${category.name}`}
                onClick={onEdit}
                size="sm"
                variant="outline"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                aria-label={`Delete category ${category.name}`}
                onClick={onDelete}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nominations</CardTitle>
              <CardDescription>
                {category.nominations.length}{" "}
                {category.nominations.length === 1 ? "nomination" : "nominations"}
              </CardDescription>
            </div>
            <Button
              aria-label="Add new nomination"
              onClick={onAddNomination}
              size="sm"
              variant="default"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Nomination
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AdminTable
            ariaLabel="Nominations table"
            columns={columns}
            data={category.nominations}
            emptyState={
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No nominations yet.</p>
                <Button className="mt-4" onClick={onAddNomination} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Nomination
                </Button>
              </div>
            }
            rowActions={rowActions.length > 0 ? rowActions : undefined}
          />
        </CardContent>
      </Card>
    </section>
  );
}

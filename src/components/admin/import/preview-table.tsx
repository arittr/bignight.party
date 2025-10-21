"use client";

import { AdminTable, type AdminTableColumn } from "@/components/admin/ui/admin-table";
import { Checkbox } from "@/components/ui/checkbox";

export interface ImportedNomination {
  id: string;
  category: string;
  nominee: string;
  work?: string;
}

export interface PreviewTableProps {
  data: ImportedNomination[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  className?: string;
}

export function PreviewTable({
  data,
  selectedIds,
  onSelectionChange,
  className,
}: PreviewTableProps) {
  const selectedCount = selectedIds.length;
  const totalCount = data.length;

  const toggleAll = () => {
    if (selectedCount === totalCount) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((item) => item.id));
    }
  };

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const columns: AdminTableColumn<ImportedNomination>[] = [
    {
      key: "select",
      label: "Select",
      render: (item) => (
        <Checkbox
          aria-label={`Select ${item.nominee} in ${item.category}`}
          checked={selectedIds.includes(item.id)}
          onCheckedChange={() => toggleItem(item.id)}
        />
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (item) => item.category,
      sortable: true,
    },
    {
      key: "nominee",
      label: "Nominee",
      render: (item) => item.nominee,
      sortable: true,
    },
    {
      key: "work",
      label: "Work",
      render: (item) => item.work ?? "-",
      sortable: true,
    },
  ];

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Checkbox
            aria-label="Select all nominations"
            checked={selectedCount > 0 && selectedCount === totalCount}
            onCheckedChange={toggleAll}
          />
          <p className="text-sm text-muted-foreground">
            {selectedCount} of {totalCount} selected
          </p>
        </div>
      </div>

      <AdminTable
        ariaLabel="Preview imported nominations"
        columns={columns}
        data={data}
        emptyState={
          <div className="text-center">
            <p className="text-muted-foreground">No nominations to preview.</p>
          </div>
        }
      />
    </div>
  );
}

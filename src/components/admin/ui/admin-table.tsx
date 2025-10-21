"use client";

import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface AdminTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render: (item: T) => React.ReactNode;
}

export interface AdminTableRowAction<T> {
  label: string;
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
}

export interface AdminTableProps<T> {
  data: T[];
  columns: AdminTableColumn<T>[];
  rowActions?: AdminTableRowAction<T>[];
  emptyState?: React.ReactNode;
  filterPlaceholder?: string;
  onFilterChange?: (value: string) => void;
  filterValue?: string;
  className?: string;
  ariaLabel?: string;
}

interface SortState {
  column: string | null;
  direction: "asc" | "desc";
}

export function AdminTable<T extends { id: string }>({
  data,
  columns,
  rowActions,
  emptyState,
  filterPlaceholder = "Filter...",
  onFilterChange,
  filterValue,
  className,
  ariaLabel = "Admin table",
}: AdminTableProps<T>) {
  const [sortState, setSortState] = React.useState<SortState>({
    column: null,
    direction: "asc",
  });
  const [internalFilter, setInternalFilter] = React.useState("");

  const filter = filterValue ?? internalFilter;
  const setFilter = onFilterChange ?? setInternalFilter;

  const handleSort = (columnKey: string) => {
    setSortState((prev) => ({
      column: columnKey,
      direction: prev.column === columnKey && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedData = React.useMemo(() => {
    if (!sortState.column) return data;

    return [...data].sort((a, b) => {
      const column = columns.find((col) => col.key === sortState.column);
      if (!column) return 0;

      const aValue = column.render(a);
      const bValue = column.render(b);

      const aString = String(aValue);
      const bString = String(bValue);

      const comparison = aString.localeCompare(bString);
      return sortState.direction === "asc" ? comparison : -comparison;
    });
  }, [data, sortState, columns]);

  const showFilter = Boolean(onFilterChange || filterPlaceholder);

  return (
    <div className={cn("space-y-4", className)}>
      {showFilter && (
        <div className="flex items-center gap-2">
          <Input
            aria-label={filterPlaceholder}
            className="max-w-sm"
            onChange={(e) => setFilter(e.target.value)}
            placeholder={filterPlaceholder}
            value={filter}
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table aria-label={ariaLabel}>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
                  {column.sortable ? (
                    <Button
                      aria-label={`Sort by ${column.label}`}
                      className="-ml-4 h-8 data-[state=open]:bg-accent"
                      onClick={() => handleSort(column.key)}
                      variant="ghost"
                    >
                      {column.label}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
              {rowActions && rowActions.length > 0 && (
                <TableHead className="w-[50px]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                >
                  {emptyState ?? "No data available."}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>{column.render(item)}</TableCell>
                  ))}
                  {rowActions && rowActions.length > 0 && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-label={`Actions for row ${item.id}`}
                            className="h-8 w-8 p-0"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {rowActions.map((action) => (
                            <DropdownMenuItem
                              className={
                                action.variant === "destructive"
                                  ? "text-destructive focus:text-destructive"
                                  : ""
                              }
                              key={action.label}
                              onClick={() => action.onClick(item)}
                            >
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

export interface ResourceItem {
  id: string;
  [key: string]: unknown;
}

export interface UseResourceManagerConfig<T extends ResourceItem> {
  /**
   * The resources to manage
   */
  resources: T[];

  /**
   * Fields to search in when filtering
   * @example ["name", "slug", "description"]
   */
  searchFields: (keyof T)[];

  /**
   * Optional delete handler
   */
  onDelete?: (resourceId: string) => Promise<void>;
}

export interface UseResourceManagerReturn<T extends ResourceItem> {
  /**
   * Filtered resources based on current filter value
   */
  filteredResources: T[];

  /**
   * Current filter string
   */
  filterValue: string;

  /**
   * Update the filter string
   */
  setFilterValue: (value: string) => void;

  /**
   * Whether delete dialog is open
   */
  deleteDialogOpen: boolean;

  /**
   * ID of resource pending deletion
   */
  resourceToDelete: string | null;

  /**
   * Whether delete operation is in progress
   */
  isDeleting: boolean;

  /**
   * Open delete confirmation dialog for a resource
   */
  handleDeleteClick: (resourceId: string) => void;

  /**
   * Close delete confirmation dialog
   */
  handleDeleteCancel: () => void;

  /**
   * Confirm and execute delete operation
   */
  handleDeleteConfirm: () => Promise<void>;

  /**
   * Navigate to view page
   */
  handleView: (resourceId: string) => void;

  /**
   * Navigate to edit page
   */
  handleEdit: (resourceId: string) => void;

  /**
   * Navigate to create page
   */
  handleCreate: () => void;

  /**
   * Whether resources list is empty (before filtering)
   */
  isEmpty: boolean;

  /**
   * Whether filtered list is empty (after filtering)
   */
  isEmptyFiltered: boolean;
}

export interface UseResourceManagerOptions {
  /**
   * Route for viewing a resource detail
   */
  viewRoute: (id: string) => string;

  /**
   * Route for editing a resource
   */
  editRoute: (id: string) => string;

  /**
   * Route for creating a new resource
   */
  createRoute: string;

  /**
   * Success message to show after deletion
   */
  deleteSuccessMessage?: string;

  /**
   * Error message to show on deletion failure
   */
  deleteErrorMessage?: string;
}

/**
 * Custom hook for managing admin resource lists
 *
 * Provides:
 * - Filtering state and logic
 * - Delete confirmation dialog state
 * - Navigation helpers (view, edit, create)
 * - Empty state detection
 *
 * @example
 * ```tsx
 * const manager = useResourceManager(
 *   {
 *     resources: events,
 *     searchFields: ["name", "slug"],
 *     onDelete: deleteEventAction,
 *   },
 *   {
 *     viewRoute: (id) => routes.admin.events.detail(id),
 *     editRoute: (id) => routes.admin.events.detail(id),
 *     createRoute: routes.admin.events.new(),
 *     deleteSuccessMessage: "Event deleted successfully",
 *   }
 * );
 *
 * return (
 *   <EventList
 *     events={manager.filteredResources}
 *     onView={manager.handleView}
 *     onEdit={manager.handleEdit}
 *     onDelete={manager.handleDeleteClick}
 *   />
 * );
 * ```
 */
export function useResourceManager<T extends ResourceItem>(
  config: UseResourceManagerConfig<T>,
  options: UseResourceManagerOptions
): UseResourceManagerReturn<T> {
  const router = useRouter();
  const { resources, searchFields, onDelete } = config;
  const { viewRoute, editRoute, createRoute } = options;

  const [filterValue, setFilterValue] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Memoized filtering logic
  const filteredResources = useMemo(() => {
    if (!filterValue) return resources;

    const lowerFilter = filterValue.toLowerCase();
    return resources.filter((resource) => {
      return searchFields.some((field) => {
        const value = resource[field];
        if (typeof value === "string") {
          return value.toLowerCase().includes(lowerFilter);
        }
        return false;
      });
    });
  }, [resources, filterValue, searchFields]);

  // Empty state detection
  const isEmpty = resources.length === 0;
  const isEmptyFiltered = filteredResources.length === 0 && !isEmpty;

  // Navigation handlers
  const handleView = useCallback(
    (resourceId: string) => {
      router.push(viewRoute(resourceId));
    },
    [router, viewRoute]
  );

  const handleEdit = useCallback(
    (resourceId: string) => {
      router.push(editRoute(resourceId));
    },
    [router, editRoute]
  );

  const handleCreate = useCallback(() => {
    router.push(createRoute);
  }, [router, createRoute]);

  // Delete dialog handlers
  const handleDeleteClick = useCallback((resourceId: string) => {
    setResourceToDelete(resourceId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setResourceToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!resourceToDelete || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(resourceToDelete);
      setDeleteDialogOpen(false);
      setResourceToDelete(null);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }, [resourceToDelete, onDelete, router]);

  return {
    deleteDialogOpen,
    filteredResources,
    filterValue,
    handleCreate,
    handleDeleteCancel,
    handleDeleteClick,
    handleDeleteConfirm,
    handleEdit,
    handleView,
    isDeleting,
    isEmpty,
    isEmptyFiltered,
    resourceToDelete,
    setFilterValue,
  };
}

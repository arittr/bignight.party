import { act, renderHook } from "@testing-library/react";
import { useRouter } from "next/navigation";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useResourceManager } from "./use-resource-manager";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

interface TestResource {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  [key: string]: unknown;
}

describe("useResourceManager", () => {
  const mockRouter = {
    push: vi.fn(),
    refresh: vi.fn(),
  };

  const mockResources: TestResource[] = [
    { description: "First event", id: "1", name: "Test Event 1", slug: "test-event-1" },
    { description: "Second event", id: "2", name: "Test Event 2", slug: "test-event-2" },
    { description: null, id: "3", name: "Other Item", slug: "other-item" },
  ];

  const mockOptions = {
    createRoute: "/admin/events/new",
    deleteErrorMessage: "Failed to delete",
    deleteSuccessMessage: "Resource deleted",
    editRoute: (id: string) => `/admin/events/${id}/edit`,
    viewRoute: (id: string) => `/admin/events/${id}`,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue(mockRouter);
  });

  describe("initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name", "slug"],
          },
          mockOptions
        )
      );

      expect(result.current.filterValue).toBe("");
      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.resourceToDelete).toBe(null);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.filteredResources).toEqual(mockResources);
      expect(result.current.isEmpty).toBe(false);
      expect(result.current.isEmptyFiltered).toBe(false);
    });

    it("should detect empty resources", () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: [],
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      expect(result.current.isEmpty).toBe(true);
      expect(result.current.filteredResources).toEqual([]);
    });
  });

  describe("filtering", () => {
    it("should filter resources by name", () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name", "slug"],
          },
          mockOptions
        )
      );

      act(() => {
        result.current.setFilterValue("test");
      });

      expect(result.current.filteredResources).toHaveLength(2);
      expect(result.current.filteredResources[0].id).toBe("1");
      expect(result.current.filteredResources[1].id).toBe("2");
    });

    it("should filter resources by slug", () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name", "slug"],
          },
          mockOptions
        )
      );

      act(() => {
        result.current.setFilterValue("other-item");
      });

      expect(result.current.filteredResources).toHaveLength(1);
      expect(result.current.filteredResources[0].id).toBe("3");
    });

    it("should be case-insensitive", () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      act(() => {
        result.current.setFilterValue("TEST");
      });

      expect(result.current.filteredResources).toHaveLength(2);
    });

    it("should return all resources when filter is empty", () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      act(() => {
        result.current.setFilterValue("test");
      });

      expect(result.current.filteredResources).toHaveLength(2);

      act(() => {
        result.current.setFilterValue("");
      });

      expect(result.current.filteredResources).toEqual(mockResources);
    });

    it("should detect empty filtered state", () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      act(() => {
        result.current.setFilterValue("nonexistent");
      });

      expect(result.current.isEmptyFiltered).toBe(true);
      expect(result.current.isEmpty).toBe(false);
    });

    it("should only search in specified fields", () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name"], // Only name, not description
          },
          mockOptions
        )
      );

      act(() => {
        result.current.setFilterValue("First event"); // In description only
      });

      expect(result.current.filteredResources).toHaveLength(0);
    });
  });

  describe("navigation", () => {
    it("should navigate to view route", () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      act(() => {
        result.current.handleView("1");
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/admin/events/1");
    });

    it("should navigate to edit route", () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      act(() => {
        result.current.handleEdit("2");
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/admin/events/2/edit");
    });

    it("should navigate to create route", () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      act(() => {
        result.current.handleCreate();
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/admin/events/new");
    });
  });

  describe("delete dialog", () => {
    it("should open delete dialog", () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      act(() => {
        result.current.handleDeleteClick("1");
      });

      expect(result.current.deleteDialogOpen).toBe(true);
      expect(result.current.resourceToDelete).toBe("1");
    });

    it("should close delete dialog", () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      act(() => {
        result.current.handleDeleteClick("1");
      });

      expect(result.current.deleteDialogOpen).toBe(true);

      act(() => {
        result.current.handleDeleteCancel();
      });

      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.resourceToDelete).toBe(null);
    });

    it("should execute delete and refresh router", async () => {
      const mockOnDelete = vi.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useResourceManager(
          {
            onDelete: mockOnDelete,
            resources: mockResources,
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      act(() => {
        result.current.handleDeleteClick("1");
      });

      await act(async () => {
        await result.current.handleDeleteConfirm();
      });

      expect(mockOnDelete).toHaveBeenCalledWith("1");
      expect(mockRouter.refresh).toHaveBeenCalled();
      expect(result.current.deleteDialogOpen).toBe(false);
      expect(result.current.resourceToDelete).toBe(null);
    });

    it("should set isDeleting during delete operation", async () => {
      const mockOnDelete = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      const { result } = renderHook(() =>
        useResourceManager(
          {
            onDelete: mockOnDelete,
            resources: mockResources,
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      act(() => {
        result.current.handleDeleteClick("1");
      });

      const deletePromise = act(async () => {
        await result.current.handleDeleteConfirm();
      });

      // Should be deleting immediately after confirm
      expect(result.current.isDeleting).toBe(true);

      await deletePromise;

      // Should no longer be deleting after completion
      expect(result.current.isDeleting).toBe(false);
    });

    it("should reset isDeleting even on error", async () => {
      const mockOnDelete = vi.fn().mockRejectedValue(new Error("Delete failed"));

      const { result } = renderHook(() =>
        useResourceManager(
          {
            onDelete: mockOnDelete,
            resources: mockResources,
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      act(() => {
        result.current.handleDeleteClick("1");
      });

      await act(async () => {
        try {
          await result.current.handleDeleteConfirm();
        } catch {
          // Expected error
        }
      });

      expect(result.current.isDeleting).toBe(false);
    });

    it("should do nothing when confirming without resource to delete", async () => {
      const mockOnDelete = vi.fn();

      const { result } = renderHook(() =>
        useResourceManager(
          {
            onDelete: mockOnDelete,
            resources: mockResources,
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      await act(async () => {
        await result.current.handleDeleteConfirm();
      });

      expect(mockOnDelete).not.toHaveBeenCalled();
      expect(mockRouter.refresh).not.toHaveBeenCalled();
    });

    it("should do nothing when confirming without onDelete handler", async () => {
      const { result } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name"],
            // No onDelete provided
          },
          mockOptions
        )
      );

      act(() => {
        result.current.handleDeleteClick("1");
      });

      await act(async () => {
        await result.current.handleDeleteConfirm();
      });

      expect(mockRouter.refresh).not.toHaveBeenCalled();
    });
  });

  describe("memoization", () => {
    it("should maintain stable function references", () => {
      const { result, rerender } = renderHook(() =>
        useResourceManager(
          {
            resources: mockResources,
            searchFields: ["name"],
          },
          mockOptions
        )
      );

      const firstHandleView = result.current.handleView;
      const firstHandleEdit = result.current.handleEdit;
      const firstHandleCreate = result.current.handleCreate;
      const firstHandleDeleteClick = result.current.handleDeleteClick;
      const firstHandleDeleteCancel = result.current.handleDeleteCancel;

      rerender();

      expect(result.current.handleView).toBe(firstHandleView);
      expect(result.current.handleEdit).toBe(firstHandleEdit);
      expect(result.current.handleCreate).toBe(firstHandleCreate);
      expect(result.current.handleDeleteClick).toBe(firstHandleDeleteClick);
      expect(result.current.handleDeleteCancel).toBe(firstHandleDeleteCancel);
      // Note: handleDeleteConfirm depends on resourceToDelete, so it may change
    });

    it("should only recompute filtered resources when dependencies change", () => {
      const { result, rerender } = renderHook(
        ({ resources }) =>
          useResourceManager(
            {
              resources,
              searchFields: ["name"],
            },
            mockOptions
          ),
        { initialProps: { resources: mockResources } }
      );

      const firstFiltered = result.current.filteredResources;

      // Rerender with same props
      rerender({ resources: mockResources });

      // Should be same reference (memoized)
      expect(result.current.filteredResources).toBe(firstFiltered);

      // Change filter
      act(() => {
        result.current.setFilterValue("test");
      });

      // Should be different reference (recomputed)
      expect(result.current.filteredResources).not.toBe(firstFiltered);
    });
  });
});

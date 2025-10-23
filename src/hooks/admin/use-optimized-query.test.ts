import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllQueryCache, invalidateQuery, useOptimizedQuery } from "./use-optimized-query";

describe("useOptimizedQuery", () => {
  beforeEach(() => {
    clearAllQueryCache();
    vi.clearAllMocks();
  });

  describe("basic query", () => {
    it("should fetch data on mount", async () => {
      const mockQueryFn = vi.fn().mockResolvedValue({ id: 1, name: "Test" });

      const { result } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "test-query",
        })
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBe(null);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ id: 1, name: "Test" });
      expect(result.current.error).toBe(null);
      expect(mockQueryFn).toHaveBeenCalledTimes(1);
    });

    it("should handle query errors", async () => {
      const mockError = new Error("Query failed");
      const mockQueryFn = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "error-query",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toEqual(mockError);
    });

    it("should not fetch when enabled is false", async () => {
      const mockQueryFn = vi.fn().mockResolvedValue({ id: 1 });

      const { result } = renderHook(() =>
        useOptimizedQuery({
          enabled: false,
          queryFn: mockQueryFn,
          queryKey: "disabled-query",
        })
      );

      expect(result.current.isLoading).toBe(false);
      expect(mockQueryFn).not.toHaveBeenCalled();
    });
  });

  describe("caching", () => {
    it("should use cached data on second mount", async () => {
      const mockQueryFn = vi.fn().mockResolvedValue({ id: 1, name: "Cached" });

      // First mount
      const { unmount } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "cache-test",
        })
      );

      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Second mount - should use cache
      const { result } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "cache-test",
        })
      );

      // Should have data immediately from cache
      expect(result.current.data).toEqual({ id: 1, name: "Cached" });
      expect(result.current.isLoading).toBe(false);
      // Should not call queryFn again
      expect(mockQueryFn).toHaveBeenCalledTimes(1);
    });

    it("should respect cache TTL", async () => {
      const mockQueryFn = vi.fn().mockResolvedValue({ id: 1 });

      // First mount with 100ms TTL
      const { unmount } = renderHook(() =>
        useOptimizedQuery({
          cacheTTL: 100,
          queryFn: mockQueryFn,
          queryKey: "ttl-test",
        })
      );

      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Second mount - cache expired, should refetch
      renderHook(() =>
        useOptimizedQuery({
          cacheTTL: 100,
          queryFn: mockQueryFn,
          queryKey: "ttl-test",
        })
      );

      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalledTimes(2);
      });
    });

    it("should share cache between multiple hook instances", async () => {
      const mockQueryFn = vi.fn().mockResolvedValue({ id: 1, name: "Shared" });

      // Mount first instance
      const { result: result1 } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "shared-query",
        })
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
      });

      expect(mockQueryFn).toHaveBeenCalledTimes(1);

      // Mount second instance with same key
      const { result: result2 } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "shared-query",
        })
      );

      // Should use cached data, not call queryFn again
      expect(result2.current.data).toEqual({ id: 1, name: "Shared" });
      expect(result2.current.isLoading).toBe(false);
      expect(mockQueryFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("refetch", () => {
    it("should refetch data when refetch is called", async () => {
      const mockQueryFn = vi
        .fn()
        .mockResolvedValueOnce({ id: 1, name: "First" })
        .mockResolvedValueOnce({ id: 2, name: "Second" });

      const { result } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "refetch-test",
        })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 1, name: "First" });
      });

      expect(mockQueryFn).toHaveBeenCalledTimes(1);

      // Refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.data).toEqual({ id: 2, name: "Second" });
      expect(mockQueryFn).toHaveBeenCalledTimes(2);
    });

    it("should maintain stable refetch reference", async () => {
      const mockQueryFn = vi.fn().mockResolvedValue({ id: 1 });

      const { result, rerender } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "stable-refetch",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstRefetch = result.current.refetch;
      rerender();
      const secondRefetch = result.current.refetch;

      expect(firstRefetch).toBe(secondRefetch);
    });
  });

  describe("invalidate", () => {
    it("should clear cache and refetch when invalidate is called", async () => {
      const mockQueryFn = vi
        .fn()
        .mockResolvedValueOnce({ id: 1, name: "First" })
        .mockResolvedValueOnce({ id: 2, name: "Second" });

      const { result } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "invalidate-test",
        })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 1, name: "First" });
      });

      // Invalidate and refetch
      await act(async () => {
        await result.current.invalidate();
      });

      expect(result.current.data).toEqual({ id: 2, name: "Second" });
      expect(mockQueryFn).toHaveBeenCalledTimes(2);
    });

    it("should clear cache using invalidateQuery utility", async () => {
      const mockQueryFn = vi.fn().mockResolvedValue({ id: 1 });

      const { unmount } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "invalidate-util-test",
        })
      );

      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Invalidate using utility
      invalidateQuery("invalidate-util-test");

      // Remount - should refetch because cache was invalidated
      renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "invalidate-util-test",
        })
      );

      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("auto-refetch", () => {
    it("should auto-refetch at specified interval", async () => {
      vi.useFakeTimers();
      const mockQueryFn = vi.fn().mockResolvedValue({ id: 1 });

      renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "auto-refetch-test",
          refetchInterval: 1000, // 1 second
        })
      );

      // Initial fetch
      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 1 second
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalledTimes(2);
      });

      // Fast-forward another second
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalledTimes(3);
      });

      vi.useRealTimers();
    });

    it("should not auto-refetch when refetchInterval is 0", async () => {
      vi.useFakeTimers();
      const mockQueryFn = vi.fn().mockResolvedValue({ id: 1 });

      renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "no-auto-refetch",
          refetchInterval: 0,
        })
      );

      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalledTimes(1);
      });

      // Fast-forward time
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Should still be 1
      expect(mockQueryFn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe("query deduplication", () => {
    it("should not trigger duplicate fetches for concurrent requests", async () => {
      const mockQueryFn = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ id: 1 }), 100))
        );

      const { result } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "dedup-test",
        })
      );

      // Trigger multiple refetches before first completes
      act(() => {
        result.current.refetch();
        result.current.refetch();
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only call queryFn twice (initial + one refetch)
      expect(mockQueryFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("cleanup", () => {
    it("should not update state after unmount", async () => {
      const mockQueryFn = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ id: 1 }), 100))
        );

      const { unmount } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn,
          queryKey: "cleanup-test",
        })
      );

      // Unmount before query completes
      unmount();

      // Wait for query to complete
      await new Promise((resolve) => setTimeout(resolve, 150));

      // No errors should occur (state updates after unmount are prevented)
      expect(mockQueryFn).toHaveBeenCalledTimes(1);
    });

    it("should clear all caches with clearAllQueryCache", async () => {
      const mockQueryFn1 = vi.fn().mockResolvedValue({ id: 1 });
      const mockQueryFn2 = vi.fn().mockResolvedValue({ id: 2 });

      const { unmount: unmount1 } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn1,
          queryKey: "clear-all-1",
        })
      );

      const { unmount: unmount2 } = renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn2,
          queryKey: "clear-all-2",
        })
      );

      await waitFor(() => {
        expect(mockQueryFn1).toHaveBeenCalledTimes(1);
        expect(mockQueryFn2).toHaveBeenCalledTimes(1);
      });

      unmount1();
      unmount2();

      // Clear all caches
      clearAllQueryCache();

      // Remount - should refetch both
      renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn1,
          queryKey: "clear-all-1",
        })
      );

      renderHook(() =>
        useOptimizedQuery({
          queryFn: mockQueryFn2,
          queryKey: "clear-all-2",
        })
      );

      await waitFor(() => {
        expect(mockQueryFn1).toHaveBeenCalledTimes(2);
        expect(mockQueryFn2).toHaveBeenCalledTimes(2);
      });
    });
  });
});

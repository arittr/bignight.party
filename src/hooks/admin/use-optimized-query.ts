"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Query cache entry
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Query cache with TTL support
 */
class QueryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    const maxAge = ttl ?? this.defaultTTL;

    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton cache instance
const globalCache = new QueryCache();

/**
 * Configuration for optimized query hook
 */
export interface UseOptimizedQueryConfig<T> {
  /**
   * Unique key for caching this query
   */
  queryKey: string;

  /**
   * Query function that fetches the data
   */
  queryFn: () => Promise<T>;

  /**
   * Cache time-to-live in milliseconds
   * @default 300000 (5 minutes)
   */
  cacheTTL?: number;

  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  enabled?: boolean;

  /**
   * Refetch interval in milliseconds (0 = no auto-refetch)
   * @default 0
   */
  refetchInterval?: number;
}

/**
 * Result of optimized query hook
 */
export interface UseOptimizedQueryResult<T> {
  /**
   * Query data (null if not yet loaded)
   */
  data: T | null;

  /**
   * Whether query is currently loading
   */
  isLoading: boolean;

  /**
   * Query error if any
   */
  error: Error | null;

  /**
   * Manually refetch the query
   */
  refetch: () => Promise<void>;

  /**
   * Invalidate cache and refetch
   */
  invalidate: () => Promise<void>;
}

/**
 * Custom hook for optimized data fetching with caching and memoization
 *
 * Features:
 * - Automatic caching with configurable TTL
 * - Query deduplication (multiple components using same query share result)
 * - Manual refetch and cache invalidation
 * - Optional auto-refetch interval
 * - Memoized results
 *
 * @example
 * ```tsx
 * function EventList() {
 *   const { data, isLoading, error, refetch } = useOptimizedQuery({
 *     queryKey: "events-list",
 *     queryFn: async () => {
 *       const response = await fetch("/api/events");
 *       return response.json();
 *     },
 *     cacheTTL: 5 * 60 * 1000, // 5 minutes
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return <List items={data} onRefresh={refetch} />;
 * }
 * ```
 */
export function useOptimizedQuery<T>({
  queryKey,
  queryFn,
  cacheTTL,
  enabled = true,
  refetchInterval = 0,
}: UseOptimizedQueryConfig<T>): UseOptimizedQueryResult<T> {
  const [data, setData] = useState<T | null>(() => globalCache.get<T>(queryKey, cacheTTL));
  const [isLoading, setIsLoading] = useState<boolean>(!data && enabled);
  const [error, setError] = useState<Error | null>(null);

  // Track if component is mounted to avoid state updates after unmount
  const isMounted = useRef(true);

  // Track ongoing fetch to prevent duplicates
  const ongoingFetch = useRef<Promise<void> | null>(null);

  // NOTE: Complexity is acceptable for query fetching with caching, error handling, and deduplication
  const fetchData = useMemo(
    () => async () => {
      // Return existing fetch if one is in progress
      if (ongoingFetch.current) {
        return ongoingFetch.current;
      }

      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex state management for optimized queries with caching, deduplication, and error handling
      const fetchPromise = (async () => {
        setIsLoading(true);
        setError(null);

        try {
          const result = await queryFn();

          if (isMounted.current) {
            setData(result);
            globalCache.set(queryKey, result);
          }
        } catch (err) {
          if (isMounted.current) {
            const errorObj = err instanceof Error ? err : new Error(String(err));
            setError(errorObj);
          }
        } finally {
          if (isMounted.current) {
            setIsLoading(false);
          }
          ongoingFetch.current = null;
        }
      })();

      ongoingFetch.current = fetchPromise;
      return fetchPromise;
    },
    [queryKey, queryFn]
  );

  const refetch = useMemo(() => fetchData, [fetchData]);

  const invalidate = useMemo(
    () => async () => {
      globalCache.invalidate(queryKey);
      await fetchData();
    },
    [queryKey, fetchData]
  );

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;

    const cached = globalCache.get<T>(queryKey, cacheTTL);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    fetchData();
  }, [enabled, queryKey, cacheTTL, fetchData]);

  // Auto-refetch interval
  useEffect(() => {
    if (!enabled || refetchInterval <= 0) return;

    const interval = setInterval(() => {
      fetchData();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [enabled, refetchInterval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    data,
    error,
    invalidate,
    isLoading,
    refetch,
  };
}

/**
 * Utility to manually clear all cached queries
 */
export function clearAllQueryCache(): void {
  globalCache.clear();
}

/**
 * Utility to manually invalidate a specific query cache
 */
export function invalidateQuery(queryKey: string): void {
  globalCache.invalidate(queryKey);
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { routes } from "@/lib/routes";

export interface UseAdminNavigationReturn {
  navigate: (path: string) => void;
  goBack: (fallback?: string) => void;
  currentPath: string;
  routes: typeof routes;
}

/**
 * Custom hook for type-safe admin navigation
 *
 * Features:
 * - Type-safe navigation using centralized routes.ts
 * - Back navigation with fallback support
 * - Current path tracking
 * - Access to all route helpers
 *
 * @returns Navigation handlers and current path
 *
 * @example
 * ```tsx
 * const { navigate, goBack, currentPath, routes } = useAdminNavigation();
 *
 * const handleSave = async () => {
 *   await saveAction({ data });
 *   navigate(routes.admin.events.index());
 * };
 *
 * const handleCancel = () => {
 *   goBack(routes.admin.events.index());
 * };
 * ```
 */
export function useAdminNavigation(): UseAdminNavigationReturn {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  const goBack = useCallback(
    (fallback?: string) => {
      // Try browser back navigation
      if (window.history.length > 1) {
        router.back();
      } else if (fallback) {
        // Fallback to provided route
        router.push(fallback);
      } else {
        // Default fallback to admin home
        router.push(routes.admin.index());
      }
    },
    [router]
  );

  return {
    currentPath: pathname,
    goBack,
    navigate,
    routes,
  };
}

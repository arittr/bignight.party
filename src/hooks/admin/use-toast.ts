"use client";

import { useCallback, useState } from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

export interface UseToastReturn {
  toasts: Toast[];
  showToast: (message: string, variant: ToastVariant, duration?: number) => void;
  hideToast: (id: string) => void;
}

/**
 * Custom hook for managing toast notifications queue
 *
 * Features:
 * - Toast queue management
 * - Auto-dismiss timing
 * - Success/error/info/warning variants
 * - Manual dismiss support
 *
 * @returns Toast state and handlers
 *
 * @example
 * ```tsx
 * const { toasts, showToast, hideToast } = useToast();
 *
 * const handleSave = async () => {
 *   try {
 *     await saveAction({ data });
 *     showToast("Saved successfully!", "success");
 *   } catch (error) {
 *     showToast("Failed to save", "error");
 *   }
 * };
 *
 * return (
 *   <div>
 *     {toasts.map(toast => (
 *       <ToastItem key={toast.id} {...toast} onClose={() => hideToast(toast.id)} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast: Toast = { duration, id, message, variant };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    hideToast,
    showToast,
    toasts,
  };
}

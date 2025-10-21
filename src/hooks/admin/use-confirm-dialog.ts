"use client";

import { useCallback, useState } from "react";

export interface UseConfirmDialogReturn {
  isOpen: boolean;
  open: (callback: () => void | Promise<void>) => void;
  close: () => void;
  confirm: () => Promise<void>;
}

/**
 * Custom hook for managing confirmation dialog state
 *
 * Features:
 * - Dialog open/close state management
 * - Confirmation callback management
 * - Async callback support
 *
 * @returns Dialog state and handlers
 *
 * @example
 * ```tsx
 * const dialog = useConfirmDialog();
 *
 * const handleDelete = () => {
 *   dialog.open(async () => {
 *     await deleteAction({ id });
 *     toast.success("Deleted successfully");
 *   });
 * };
 *
 * return (
 *   <>
 *     <Button onClick={handleDelete}>Delete</Button>
 *     <ConfirmDialog
 *       open={dialog.isOpen}
 *       onOpenChange={dialog.close}
 *       onConfirm={dialog.confirm}
 *       title="Confirm Delete"
 *       description="This action cannot be undone."
 *     />
 *   </>
 * );
 * ```
 */
export function useConfirmDialog(): UseConfirmDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [callback, setCallback] = useState<(() => void | Promise<void>) | null>(null);

  const open = useCallback((cb: () => void | Promise<void>) => {
    setCallback(() => cb);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setCallback(null);
  }, []);

  const confirm = useCallback(async () => {
    if (callback) {
      await callback();
    }
    close();
  }, [callback, close]);

  return {
    close,
    confirm,
    isOpen,
    open,
  };
}

import { useEffect, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved";

export interface UseSaveIndicatorReturn {
  status: SaveStatus;
  setSaving: () => void;
  setSaved: () => void;
  reset: () => void;
}

/**
 * Custom hook for managing save status indicator with auto-reset
 *
 * Handles:
 * - Save status tracking (idle → saving → saved → idle)
 * - Auto-reset to idle after 2 seconds when saved
 * - Manual reset capability
 *
 * Status flow:
 * - idle: No ongoing save operation
 * - saving: Save in progress (show spinner)
 * - saved: Save completed successfully (show checkmark)
 * - Auto-reset to idle after 2 seconds
 *
 * @returns Save status state and control functions
 */
export function useSaveIndicator(): UseSaveIndicatorReturn {
  const [status, setStatus] = useState<SaveStatus>("idle");

  // Auto-reset to idle after 2 seconds when status is 'saved'
  useEffect(() => {
    if (status === "saved") {
      const timer = setTimeout(() => {
        setStatus("idle");
      }, 2000);

      // Cleanup timer on unmount or status change
      return () => clearTimeout(timer);
    }
  }, [status]);

  const setSaving = () => setStatus("saving");
  const setSaved = () => setStatus("saved");
  const reset = () => setStatus("idle");

  return {
    reset,
    setSaved,
    setSaving,
    status,
  };
}

import { Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SaveStatus } from "@/hooks/game/use-save-indicator";

interface SaveIndicatorProps {
  status: SaveStatus;
}

/**
 * Save status indicator with loading and success states
 *
 * Features:
 * - Loading spinner when saving
 * - Success checkmark when saved
 * - Auto-hides when idle
 * - Uses Badge component with custom variants
 * - Positioned in top-right corner (via parent layout)
 *
 * This is a Server Component (no client interactions).
 * Note: While this doesn't have client interactions, it receives
 * status from a client hook, so it will be rendered within a client context.
 */
export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <Badge
      className="flex items-center gap-1.5"
      variant={status === "saved" ? "success" : "default"}
    >
      {status === "saving" ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Check className="h-3 w-3" />
          <span>Saved</span>
        </>
      )}
    </Badge>
  );
}

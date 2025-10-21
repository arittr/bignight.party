import { Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PickStatusBannerProps {
  isLocked: boolean;
  locksAt: Date | null;
  status: "SETUP" | "OPEN" | "LIVE" | "COMPLETED";
}

/**
 * Banner showing pick lock warnings and game status
 *
 * Features:
 * - Warning alert when picks are locked
 * - Lock icon for visual emphasis
 * - Contextual messages based on game status
 * - Conditionally rendered (only shows when relevant)
 *
 * This is a Server Component (no client interactions).
 */
export function PickStatusBanner({ isLocked, locksAt, status }: PickStatusBannerProps) {
  // Don't show banner if picks are not locked
  if (!isLocked) {
    return null;
  }

  const getMessage = () => {
    if (status === "LIVE") {
      return "The ceremony has started. Picks are now locked and cannot be changed.";
    }
    if (status === "COMPLETED") {
      return "This game has ended. Picks are locked and results are final.";
    }
    if (locksAt && new Date() >= locksAt) {
      return "The deadline has passed. Picks are now locked and cannot be changed.";
    }
    return "Picks are currently locked.";
  };

  return (
    <Alert className="mb-4" variant="warning">
      <Lock className="h-4 w-4" />
      <AlertTitle>Picks Locked</AlertTitle>
      <AlertDescription>{getMessage()}</AlertDescription>
    </Alert>
  );
}

"use client";

import { match } from "ts-pattern";
import { Badge } from "@/components/ui/badge";
import type { ConnectionStatus as ConnectionStatusType } from "@/hooks/game/use-leaderboard-socket";

/**
 * Props for ConnectionStatus component
 */
export interface ConnectionStatusProps {
  /** Current connection status */
  status: ConnectionStatusType;
}

/**
 * Display WebSocket connection status with visual indicator
 *
 * Shows a colored badge with appropriate status text:
 * - Connected: Green badge with "Live" text
 * - Connecting: Yellow badge with "Connecting..." text
 * - Disconnected: Red badge with "Disconnected" text
 *
 * @param props - Component props
 * @returns Badge component with connection status
 *
 * @example
 * ```typescript
 * <ConnectionStatus status={connectionStatus} />
 * ```
 */
export function ConnectionStatus({ status }: ConnectionStatusProps) {
  return match(status)
    .with("connected", () => (
      <Badge className="text-xs" variant="success">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white" />
        Live
      </Badge>
    ))
    .with("connecting", () => (
      <Badge className="text-xs" variant="warning">
        <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        Connecting...
      </Badge>
    ))
    .with("disconnected", () => (
      <Badge className="text-xs" variant="destructive">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white" />
        Disconnected
      </Badge>
    ))
    .exhaustive();
}

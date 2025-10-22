import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Props for GameHeader component
 */
export interface GameHeaderProps {
  /** Name of the game */
  gameName: string;
  /** Name of the event */
  eventName: string;
  /** Connection status indicator (passed as children) */
  connectionStatus: ReactNode;
}

/**
 * Display game and event information at the top of the leaderboard
 *
 * Server Component that shows the game context and includes a connection
 * status indicator.
 *
 * @param props - Component props
 * @returns Card with game header information
 *
 * @example
 * ```typescript
 * <GameHeader
 *   gameName="My Game"
 *   eventName="97th Academy Awards"
 *   connectionStatus={<ConnectionStatus status={status} />}
 * />
 * ```
 */
export function GameHeader({ gameName, eventName, connectionStatus }: GameHeaderProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{gameName}</CardTitle>
            <p className="text-sm text-muted-foreground">{eventName}</p>
          </div>
          <div className="flex items-center">{connectionStatus}</div>
        </div>
      </CardHeader>
    </Card>
  );
}

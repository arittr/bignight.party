"use client";

import { useLeaderboardSocket } from "@/hooks/game/use-leaderboard-socket";
import type { LeaderboardPlayer } from "@/types/leaderboard";
import { ConnectionStatus } from "./connection-status";
import { GameHeader } from "./game-header";
import { LeaderboardList } from "./leaderboard-list";

/**
 * Props for LeaderboardClient component
 */
export interface LeaderboardClientProps {
  /** ID of the game */
  gameId: string;
  /** Initial player data from SSR */
  initialPlayers: LeaderboardPlayer[];
  /** Name of the game */
  gameName: string;
  /** Name of the event */
  eventName: string;
}

/**
 * Client-side orchestrator for the leaderboard
 *
 * Client Component that manages WebSocket connection and coordinates all
 * leaderboard child components. Receives initial SSR data and updates
 * in real-time via WebSocket.
 *
 * @param props - Component props
 * @returns Complete leaderboard UI with live updates
 *
 * @example
 * ```typescript
 * <LeaderboardClient
 *   gameId="game-123"
 *   initialPlayers={players}
 *   gameName="My Game"
 *   eventName="97th Academy Awards"
 * />
 * ```
 */
export function LeaderboardClient({
  gameId,
  initialPlayers,
  gameName,
  eventName,
}: LeaderboardClientProps) {
  // Connect to WebSocket and get live updates
  const { players, connectionStatus } = useLeaderboardSocket(gameId, initialPlayers);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Game header with connection status */}
      <GameHeader
        connectionStatus={<ConnectionStatus status={connectionStatus} />}
        eventName={eventName}
        gameName={gameName}
      />

      {/* Player list with live updates */}
      <LeaderboardList players={players} />
    </div>
  );
}

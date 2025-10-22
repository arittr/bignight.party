import type { LeaderboardPlayer } from "@/types/leaderboard";
import { PlayerCard } from "./player-card";

/**
 * Props for LeaderboardList component
 */
export interface LeaderboardListProps {
  /** Array of players to display */
  players: LeaderboardPlayer[];
}

/**
 * Display list of players on the leaderboard
 *
 * Server Component that maps players to PlayerCard components.
 * Handles empty state when no players have complete picks.
 *
 * @param props - Component props
 * @returns List of player cards or empty state
 *
 * @example
 * ```typescript
 * <LeaderboardList players={players} />
 * ```
 */
export function LeaderboardList({ players }: LeaderboardListProps) {
  // Empty state: no players with complete picks
  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-5xl">🏆</div>
        <h3 className="mb-2 text-lg font-semibold">No Leaderboard Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          The leaderboard will appear once winners are revealed and players have complete picks for
          all categories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {players.map((player, index) => (
        <PlayerCard index={index} key={player.userId} player={player} />
      ))}
    </div>
  );
}

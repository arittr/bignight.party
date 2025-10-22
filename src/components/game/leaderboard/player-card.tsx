import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LeaderboardPlayer } from "@/types/leaderboard";

/**
 * Props for PlayerCard component
 */
export interface PlayerCardProps {
  /** Player data to display */
  player: LeaderboardPlayer;
  /** Index in the list (for animation delays) */
  index: number;
}

/**
 * Display a single player's leaderboard information
 *
 * Server Component that shows rank, avatar, name, score, and correct picks count.
 * Highlights the current user's card with a different background color.
 * Reserves space at bottom for future reaction buttons (hidden).
 *
 * @param props - Component props
 * @returns Card with player information
 *
 * @example
 * ```typescript
 * <PlayerCard player={playerData} index={0} />
 * ```
 */
export function PlayerCard({ player }: PlayerCardProps) {
  const { rank, name, image, totalScore, correctCount, isCurrentUser } = player;

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-md",
        isCurrentUser && "border-primary bg-primary/5"
      )}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Rank */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
          <span
            className={cn(
              "text-2xl font-bold tabular-nums",
              rank === 1 && "text-yellow-500",
              rank === 2 && "text-gray-400",
              rank === 3 && "text-amber-700",
              rank > 3 && "text-muted-foreground"
            )}
          >
            {rank}
          </span>
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          {image ? (
            // biome-ignore lint/performance/noImgElement: User avatars are external URLs, not static assets
            <img alt={name} className="h-10 w-10 rounded-full object-cover" src={image} />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-sm font-semibold">{name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Name and Stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="truncate font-semibold">{name}</p>
            {isCurrentUser && <span className="text-xs text-primary font-medium">(You)</span>}
          </div>
          <p className="text-sm text-muted-foreground">
            {correctCount} correct {correctCount === 1 ? "pick" : "picks"}
          </p>
        </div>

        {/* Score */}
        <div className="flex-shrink-0 text-right">
          <p className="text-2xl font-bold tabular-nums">{totalScore}</p>
          <p className="text-xs text-muted-foreground">points</p>
        </div>
      </div>

      {/* Reserved space for future reaction buttons (hidden) */}
      <div className="hidden" data-reaction-container="true" />
    </Card>
  );
}

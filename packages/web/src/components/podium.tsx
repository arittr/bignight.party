import type { LeaderboardPlayer } from "@bignight/shared";

interface PodiumProps {
  players: LeaderboardPlayer[]; // Top 3 (or fewer)
}

export function Podium({ players }: PodiumProps) {
  if (players.length === 0) return null;

  // Reorder for visual: 2nd, 1st, 3rd
  const ordered = [players[1], players[0], players[2]].filter(
    (p): p is LeaderboardPlayer => p !== undefined,
  );
  const heights = ["h-20", "h-28", "h-16"];
  const medals = ["🥈", "👑", "🥉"];

  return (
    <div className="flex items-end justify-center gap-2 mb-6">
      {ordered.map((player, i) => (
        <div key={player.playerId} className="flex flex-col items-center">
          <span className="text-2xl mb-1">{medals[i]}</span>
          <p className="text-sm font-medium text-white truncate max-w-[80px]">
            {player.name}
          </p>
          <p className="text-xs text-[#e2b04a]">{player.totalScore} pts</p>
          <div
            className={`w-20 ${heights[i]} bg-gradient-to-t from-[#e2b04a]/20 to-[#e2b04a]/5 rounded-t-lg mt-1 flex items-center justify-center`}
          >
            <span className="text-lg font-bold text-[#e2b04a]">
              #{player.rank}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

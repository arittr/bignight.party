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
  const heights = ["h-20 md:h-28", "h-28 md:h-40", "h-16 md:h-24"];
  const medals = ["🥈", "👑", "🥉"];

  return (
    <div className="flex items-end justify-center gap-3 md:gap-6 mb-6">
      {ordered.map((player, i) => (
        <div key={player.playerId} className="flex flex-col items-center">
          <span className="text-2xl md:text-4xl mb-1">{medals[i]}</span>
          <p className="text-sm md:text-base font-medium text-white truncate max-w-[80px] md:max-w-[120px]">
            {player.name}
          </p>
          <p className="text-xs md:text-sm text-[#e2b04a]">{player.totalScore} pts</p>
          <div
            className={`w-20 md:w-32 ${heights[i]} bg-gradient-to-t from-[#e2b04a]/20 to-[#e2b04a]/5 rounded-t-lg mt-1 flex items-center justify-center`}
          >
            <span className="text-lg md:text-xl font-bold text-[#e2b04a]">
              #{player.rank}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

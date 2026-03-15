import { motion, AnimatePresence } from "framer-motion";
import type { LeaderboardPlayer } from "@bignight/shared";

interface PodiumProps {
  players: LeaderboardPlayer[]; // Top 3 (or fewer)
}

const PODIUM_CONFIG = [
  { position: 1, medal: "🥈", barHeight: "h-20 md:h-28", order: 0 },
  { position: 0, medal: "🪿", barHeight: "h-28 md:h-40", order: 1 },
  { position: 2, medal: "🥉", barHeight: "h-16 md:h-24", order: 2 },
] as const;

export function Podium({ players }: PodiumProps) {
  if (players.length === 0) return null;

  // Reorder for visual: 2nd, 1st, 3rd
  const ordered = [players[1], players[0], players[2]].filter(
    (p): p is LeaderboardPlayer => p !== undefined,
  );

  return (
    <div className="flex items-end justify-center gap-3 md:gap-6 mb-6">
      <AnimatePresence mode="popLayout">
        {ordered.map((player, i) => (
          <motion.div
            key={player.playerId}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{
              layout: { type: "spring", stiffness: 200, damping: 25 },
              opacity: { duration: 0.3 },
              scale: { type: "spring", stiffness: 300, damping: 20 },
            }}
            className="flex flex-col items-center"
          >
            <motion.span
              key={`medal-${player.playerId}`}
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
              className="text-2xl md:text-4xl mb-1"
            >
              {PODIUM_CONFIG[i]?.medal}
            </motion.span>
            <p className="text-sm md:text-base font-medium text-white truncate max-w-[80px] md:max-w-[120px]">
              {player.name}
            </p>
            <motion.p
              key={`score-${player.playerId}-${player.totalScore}`}
              initial={{ scale: 1.4, color: "#ffffff" }}
              animate={{ scale: 1, color: "#e2b04a" }}
              transition={{ duration: 0.5 }}
              className="text-xs md:text-sm font-semibold"
            >
              {player.totalScore} pts
            </motion.p>
            <div
              className={`w-20 md:w-32 ${PODIUM_CONFIG[i]?.barHeight} bg-gradient-to-t from-[#e2b04a]/20 to-[#e2b04a]/5 rounded-t-lg mt-1 flex items-center justify-center`}
            >
              <span className="text-lg md:text-xl font-bold text-[#e2b04a]">
                #{player.rank}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

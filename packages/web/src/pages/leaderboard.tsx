import { AnimatePresence, motion } from "framer-motion";
import { useLeaderboard } from "../hooks/use-leaderboard";
import { useReactions } from "../hooks/use-reactions";
import { useAuth } from "../auth";
import { Podium } from "../components/podium";
import { ReactionBar } from "../components/reaction-bar";

export function LeaderboardPage() {
  const { token, playerId } = useAuth();
  const { players, connectionStatus, justAnnounced, revealedCount, totalCount, isGameComplete } = useLeaderboard();
  const { reactions, sendReaction } = useReactions();

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  // Check if current player is on the board
  const currentPlayerOnBoard = players.some((p) => p.playerId === playerId);

  return (
    <div className="space-y-4 pb-20"> {/* pb-20 for reaction bar */}
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e2b04a]">Leaderboard</h1>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            connectionStatus === "connected" ? "bg-green-400" :
            connectionStatus === "connecting" ? "bg-yellow-400 animate-pulse" :
            "bg-red-400"
          }`} />
          <span className="text-xs text-gray-400">
            {connectionStatus === "connected" ? "LIVE" : connectionStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Progress */}
      <p className="text-sm text-gray-400">{revealedCount} of {totalCount} categories revealed</p>

      {/* Just Announced banner */}
      <AnimatePresence>
        {justAnnounced && (
          <motion.div
            key={`${justAnnounced.categoryName}-${justAnnounced.winnerTitle}`}
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-[#e2b04a]/20 border border-[#e2b04a]/50 px-4 py-3 rounded-lg"
          >
            <p className="text-xs text-[#e2b04a] uppercase tracking-wide font-semibold">🏆 Just Announced</p>
            <p className="text-white font-medium text-lg">{justAnnounced.categoryName}</p>
            <p className="text-[#e2b04a]">{justAnnounced.winnerTitle}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game complete banner */}
      {isGameComplete && (
        <div className="bg-[#e2b04a]/20 border border-[#e2b04a]/50 px-4 py-3 rounded-lg text-center">
          <p className="text-[#e2b04a] font-bold text-lg">🏆 Game Over!</p>
        </div>
      )}

      {/* Podium */}
      <Podium players={top3} />

      {/* Remaining players */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((player) => (
            <div
              key={player.playerId}
              className={`flex items-center justify-between p-3 rounded-lg ${
                player.playerId === playerId ? "bg-[#e2b04a]/10 border border-[#e2b04a]/30" : "bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm w-6">#{player.rank}</span>
                <span className="text-white">{player.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[#e2b04a] font-medium">{player.totalScore}</span>
                <span className="text-gray-500 text-xs ml-1">({player.correctCount} correct)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message for incomplete picks */}
      {!currentPlayerOnBoard && token && (
        <p className="text-sm text-gray-500 text-center">
          Complete all your picks to appear on the leaderboard.
        </p>
      )}

      {/* Reactions */}
      {token && <ReactionBar onReact={sendReaction} reactions={reactions} />}
    </div>
  );
}

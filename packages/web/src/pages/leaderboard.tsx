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

      {/* Podium */}
      <div className="relative pt-16">
        {/* Just Announced — overlays the podium, no layout shift */}
        <AnimatePresence>
          {justAnnounced && (
            <motion.div
              key={`${justAnnounced.categoryName}-${justAnnounced.winnerTitle}`}
              initial={{ opacity: 0, y: -30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute inset-x-0 top-0 z-10 mx-auto max-w-sm bg-[#1a1a2e]/95 backdrop-blur-sm border border-[#e2b04a]/50 px-5 py-4 rounded-xl shadow-lg shadow-[#e2b04a]/10 text-center"
            >
              <p className="text-xs text-[#e2b04a] uppercase tracking-widest font-semibold mb-1">🏆 Just Announced</p>
              <p className="text-white font-semibold text-lg">{justAnnounced.categoryName}</p>
              <p className="text-[#e2b04a] text-base">{justAnnounced.winnerTitle}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <Podium players={top3} />
      </div>

      {/* Game complete banner */}
      <AnimatePresence>
        {isGameComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#e2b04a]/20 border border-[#e2b04a]/50 px-4 py-3 rounded-lg text-center"
          >
            <p className="text-[#e2b04a] font-bold text-lg">🏆 Game Over!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remaining players */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <AnimatePresence mode="popLayout">
            {rest.map((player) => (
              <motion.div
                key={player.playerId}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{
                  layout: { type: "spring", stiffness: 200, damping: 25 },
                  opacity: { duration: 0.2 },
                }}
                className={`flex items-center justify-between p-3 md:p-4 rounded-lg ${
                  player.playerId === playerId ? "bg-[#e2b04a]/10 border border-[#e2b04a]/30" : "bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <motion.span
                    key={`rank-${player.playerId}-${player.rank}`}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="text-gray-500 text-sm w-6"
                  >
                    #{player.rank}
                  </motion.span>
                  <span className="text-white">{player.name}</span>
                </div>
                <div className="text-right">
                  <motion.span
                    key={`score-${player.playerId}-${player.totalScore}`}
                    initial={{ scale: 1.5, color: "#ffffff" }}
                    animate={{ scale: 1, color: "#e2b04a" }}
                    transition={{ duration: 0.4 }}
                    className="font-medium"
                  >
                    {player.totalScore}
                  </motion.span>
                  <span className="text-gray-500 text-xs ml-1">({player.correctCount} correct)</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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

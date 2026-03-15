import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLeaderboard } from "../hooks/use-leaderboard";
import { useReactions } from "../hooks/use-reactions";
import { useAuth } from "../auth";
import { Podium } from "../components/podium";
import { ReactionBar } from "../components/reaction-bar";
import type { LeaderboardPlayer } from "@bignight/shared";

export function LeaderboardPage() {
	const { token, playerId } = useAuth();
	const {
		players,
		connectionStatus,
		justAnnounced,
		revealedCount,
		totalCount,
		isGameComplete,
	} = useLeaderboard();
	const { reactions, sendReaction } = useReactions();

	// Track previous scores to show deltas
	const prevScoresRef = useRef<Map<string, number>>(new Map());
	const [scoreDeltas, setScoreDeltas] = useState<Map<string, number>>(
		new Map(),
	);

	useEffect(() => {
		const prev = prevScoresRef.current;
		const newDeltas = new Map<string, number>();

		for (const player of players) {
			const oldScore = prev.get(player.playerId);
			if (oldScore !== undefined && player.totalScore > oldScore) {
				newDeltas.set(player.playerId, player.totalScore - oldScore);
			}
		}

		if (newDeltas.size > 0) {
			setScoreDeltas(newDeltas);
			// Clear deltas after animation
			setTimeout(() => setScoreDeltas(new Map()), 2500);
		}

		// Update prev scores
		const next = new Map<string, number>();
		for (const player of players) {
			next.set(player.playerId, player.totalScore);
		}
		prevScoresRef.current = next;
	}, [players]);

	const top3 = players.slice(0, 3);
	const rest = players.slice(3);
	const currentPlayerOnBoard = players.some(
		(p) => p.playerId === playerId,
	);
	const progressPct =
		totalCount > 0 ? (revealedCount / totalCount) * 100 : 0;

	return (
		<div className="space-y-4 pb-20">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h1 className="text-2xl md:text-4xl font-bold text-[#e2b04a]">Leaderboard</h1>
				<div className="flex items-center gap-2">
					<span
						className={`w-2 h-2 rounded-full ${
							connectionStatus === "connected"
								? "bg-green-400"
								: connectionStatus === "connecting"
									? "bg-yellow-400 animate-pulse"
									: "bg-red-400"
						}`}
					/>
					<span className="text-xs text-gray-400">
						{connectionStatus === "connected"
							? "LIVE"
							: connectionStatus.toUpperCase()}
					</span>
				</div>
			</div>

			{/* Progress bar */}
			<div className="space-y-1">
				<div className="flex justify-between text-xs text-gray-400">
					<span>
						{revealedCount} of {totalCount} categories
					</span>
					<span>{Math.round(progressPct)}%</span>
				</div>
				<div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
					<motion.div
						className="h-full bg-gradient-to-r from-[#e2b04a] to-[#f0d078] rounded-full"
						initial={{ width: 0 }}
						animate={{ width: `${progressPct}%` }}
						transition={{ duration: 0.8, ease: "easeOut" }}
					/>
				</div>
			</div>

			{/* Podium */}
			<div className="relative pt-16">
				{/* Just Announced overlay */}
				<AnimatePresence>
					{justAnnounced && (
						<motion.div
							key={`${justAnnounced.categoryName}-${justAnnounced.winnerTitle}`}
							initial={{ opacity: 0, y: -30, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -20, scale: 0.95 }}
							transition={{
								type: "spring",
								stiffness: 300,
								damping: 25,
							}}
							className="absolute inset-x-0 top-0 z-10 mx-auto max-w-sm bg-[#1a1a2e]/95 backdrop-blur-sm border border-[#e2b04a]/50 px-5 py-4 rounded-xl shadow-lg shadow-[#e2b04a]/10 text-center"
						>
							<p className="text-xs text-[#e2b04a] uppercase tracking-widest font-semibold mb-1">
								🏆 Just Announced
							</p>
							<p className="text-white font-semibold text-lg">
								{justAnnounced.categoryName}
							</p>
							<p className="text-[#e2b04a] text-base">
								{justAnnounced.winnerTitle}
							</p>
						</motion.div>
					)}
				</AnimatePresence>

				<Podium players={top3} scoreDeltas={scoreDeltas} />
			</div>

			{/* Game complete banner */}
			<AnimatePresence>
				{isGameComplete && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						className="bg-[#e2b04a]/20 border border-[#e2b04a]/50 px-4 py-3 rounded-lg text-center"
					>
						<p className="text-[#e2b04a] font-bold text-lg">
							🏆 Game Over!
						</p>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Remaining players */}
			{rest.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-3">
					<AnimatePresence mode="popLayout">
						{rest.map((player) => (
							<PlayerRow
								key={player.playerId}
								player={player}
								isCurrentUser={player.playerId === playerId}
								scoreDelta={scoreDeltas.get(player.playerId)}
							/>
						))}
					</AnimatePresence>
				</div>
			)}

			{/* Incomplete picks message */}
			{!currentPlayerOnBoard && token && (
				<p className="text-sm text-gray-500 text-center">
					Complete all your picks to appear on the leaderboard.
				</p>
			)}

			{/* Reactions */}
			{token && (
				<ReactionBar onReact={sendReaction} reactions={reactions} />
			)}
		</div>
	);
}

function PlayerRow({
	player,
	isCurrentUser,
	scoreDelta,
}: {
	player: LeaderboardPlayer;
	isCurrentUser: boolean;
	scoreDelta?: number;
}) {
	const hasScored = scoreDelta !== undefined && scoreDelta > 0;

	return (
		<motion.div
			key={player.playerId}
			layout
			initial={{ opacity: 0, x: -20 }}
			animate={{
				opacity: 1,
				x: 0,
				boxShadow: hasScored
					? [
							"0 0 0px rgba(226,176,74,0)",
							"0 0 20px rgba(226,176,74,0.4)",
							"0 0 0px rgba(226,176,74,0)",
						]
					: "0 0 0px rgba(226,176,74,0)",
			}}
			exit={{ opacity: 0, x: 20 }}
			transition={{
				layout: { type: "spring", stiffness: 200, damping: 25 },
				opacity: { duration: 0.2 },
				boxShadow: { duration: 1.5, ease: "easeInOut" },
			}}
			className={`flex items-center justify-between p-3 rounded-lg relative overflow-hidden md:flex-col md:items-center md:justify-center md:p-4 md:gap-1 ${
				isCurrentUser
					? "bg-[#e2b04a]/10 border border-[#e2b04a]/30"
					: "bg-white/[0.04]"
			}`}
		>
			<div className="flex items-center gap-3 min-w-0 md:flex-col md:gap-0">
				<motion.span
					key={`rank-${player.playerId}-${player.rank}`}
					initial={{ scale: 1.5 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 15 }}
					className="text-gray-500 text-sm md:text-base font-medium shrink-0 md:mb-1"
				>
					#{player.rank}
				</motion.span>
				<span className="text-white md:text-lg truncate max-w-full text-center">
					{player.name}
				</span>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<AnimatePresence>
					{hasScored && (
						<motion.span
							initial={{ opacity: 0, scale: 0, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0, y: -10 }}
							transition={{
								type: "spring",
								stiffness: 400,
								damping: 15,
							}}
							className="text-xs md:text-sm font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full"
						>
							+{scoreDelta}
						</motion.span>
					)}
				</AnimatePresence>
				<motion.span
					key={`score-${player.playerId}-${player.totalScore}`}
					initial={{ scale: 2, color: "#ffffff" }}
					animate={{ scale: 1, color: "#e2b04a" }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="font-bold text-lg md:text-xl"
				>
					{player.totalScore}
				</motion.span>
				<span className="text-gray-500 text-xs md:text-sm">
					({player.correctCount})
				</span>
			</div>
		</motion.div>
	);
}

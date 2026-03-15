import { motion, AnimatePresence } from "framer-motion";
import type { LeaderboardPlayer } from "@bignight/shared";

interface PodiumProps {
	players: LeaderboardPlayer[];
	scoreDeltas?: Map<string, number>;
}

const PODIUM_CONFIG = [
	{
		medal: "🥈",
		barHeight: "h-20 md:h-28",
		barStyle: "from-gray-400/20 to-gray-400/5",
	},
	{
		medal: "🪿",
		barHeight: "h-28 md:h-40",
		barStyle:
			"from-[#e2b04a]/30 to-[#e2b04a]/10 shadow-lg shadow-[#e2b04a]/10",
	},
	{
		medal: "🥉",
		barHeight: "h-16 md:h-24",
		barStyle: "from-amber-700/20 to-amber-700/5",
	},
] as const;

export function Podium({ players, scoreDeltas }: PodiumProps) {
	if (players.length === 0) return null;

	// Reorder for visual: 2nd, 1st, 3rd
	const ordered = [players[1], players[0], players[2]].filter(
		(p): p is LeaderboardPlayer => p !== undefined,
	);

	return (
		<div className="flex items-end justify-center gap-3 md:gap-6 mb-6">
			<AnimatePresence mode="popLayout">
				{ordered.map((player, i) => {
					const delta = scoreDeltas?.get(player.playerId);
					const hasScored = delta !== undefined && delta > 0;

					return (
						<motion.div
							key={player.playerId}
							layout
							initial={{ opacity: 0, scale: 0.8, y: 30 }}
							animate={{
								opacity: 1,
								scale: 1,
								y: 0,
								filter: hasScored
									? [
											"drop-shadow(0 0 0px rgba(226,176,74,0))",
											"drop-shadow(0 0 15px rgba(226,176,74,0.6))",
											"drop-shadow(0 0 0px rgba(226,176,74,0))",
										]
									: "drop-shadow(0 0 0px rgba(226,176,74,0))",
							}}
							exit={{ opacity: 0, scale: 0.8, y: -20 }}
							transition={{
								layout: {
									type: "spring",
									stiffness: 200,
									damping: 25,
								},
								opacity: { duration: 0.3 },
								scale: {
									type: "spring",
									stiffness: 300,
									damping: 20,
								},
								filter: { duration: 1.5, ease: "easeInOut" },
							}}
							className="flex flex-col items-center"
						>
							<motion.span
								key={`medal-${player.playerId}`}
								initial={{ rotate: -20, scale: 0 }}
								animate={{ rotate: 0, scale: 1 }}
								transition={{
									type: "spring",
									stiffness: 400,
									damping: 15,
									delay: 0.1,
								}}
								className="text-2xl md:text-4xl mb-1"
							>
								{PODIUM_CONFIG[i]?.medal}
							</motion.span>
							<p className="text-sm md:text-base font-medium text-white truncate max-w-[80px] md:max-w-[120px]">
								{player.name}
							</p>

							{/* Score with delta */}
							<div className="flex items-center gap-1">
								<motion.span
									key={`score-${player.playerId}-${player.totalScore}`}
									initial={{ scale: 2, color: "#ffffff" }}
									animate={{ scale: 1, color: "#e2b04a" }}
									transition={{ duration: 0.6, ease: "easeOut" }}
									className="text-sm md:text-base font-bold"
								>
									{player.totalScore} pts
								</motion.span>
								<AnimatePresence>
									{hasScored && (
										<motion.span
											initial={{
												opacity: 0,
												scale: 0,
												y: 10,
											}}
											animate={{
												opacity: 1,
												scale: 1,
												y: 0,
											}}
											exit={{
												opacity: 0,
												scale: 0,
												y: -10,
											}}
											transition={{
												type: "spring",
												stiffness: 400,
												damping: 15,
											}}
											className="text-xs font-bold text-green-400"
										>
											+{delta}
										</motion.span>
									)}
								</AnimatePresence>
							</div>

							<div
								className={`w-20 md:w-32 ${PODIUM_CONFIG[i]?.barHeight} bg-gradient-to-t ${PODIUM_CONFIG[i]?.barStyle} rounded-t-lg mt-1 flex items-center justify-center`}
							>
								<span className="text-lg md:text-xl font-bold text-[#e2b04a]">
									#{player.rank}
								</span>
							</div>
						</motion.div>
					);
				})}
			</AnimatePresence>
		</div>
	);
}

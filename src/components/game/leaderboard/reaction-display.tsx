"use client";

import type { Reaction } from "@/types/leaderboard";
import { AnimatePresence, motion } from "framer-motion";

interface ReactionDisplayProps {
	reactions: Reaction[];
	currentUserId?: string;
}

/**
 * Floating overlay displaying animated reactions
 * Uses Framer Motion for enter/exit animations
 */
export function ReactionDisplay({
	reactions,
	currentUserId,
}: ReactionDisplayProps) {
	return (
		<div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 overflow-hidden">
			<AnimatePresence>
				{reactions.map((reaction) => {
					const isCurrentUser = reaction.userId === currentUserId;

					return (
						<motion.div
							key={reaction.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3 }}
							className={`flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg ${
								isCurrentUser
									? "bg-primary/90 text-primary-foreground"
									: "bg-card/90 text-card-foreground"
							}`}
						>
							<span className="text-2xl" aria-hidden="true">
								{reaction.emoji}
							</span>
							<span className="text-sm font-medium">{reaction.userName}</span>
						</motion.div>
					);
				})}
			</AnimatePresence>
		</div>
	);
}

"use client";

import { ReactionButton } from "./reaction-button";

interface ReactionBarProps {
	onReactionClick: (emoji: string) => void;
	disabled?: boolean;
}

/**
 * Horizontal bar of emoji reaction buttons
 * Fixed at bottom of leaderboard container
 */
export function ReactionBar({
	onReactionClick,
	disabled = false,
}: ReactionBarProps) {
	const reactions = [
		{ emoji: "🔥", label: "Fire reaction button" },
		{ emoji: "😍", label: "Love it reaction button" },
		{ emoji: "😱", label: "Shocked reaction button" },
		{ emoji: "💀", label: "Dead reaction button" },
	] as const;

	return (
		<div className="flex items-center justify-center gap-2 p-4 flex-wrap">
			{reactions.map(({ emoji, label }) => (
				<ReactionButton
					key={emoji}
					emoji={emoji}
					onClick={() => onReactionClick(emoji)}
					disabled={disabled}
					ariaLabel={label}
				/>
			))}
		</div>
	);
}

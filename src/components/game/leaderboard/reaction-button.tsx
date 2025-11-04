"use client";

import { Button } from "@/components/ui/button";

interface ReactionButtonProps {
	emoji: string;
	onClick: () => void;
	disabled?: boolean;
	ariaLabel: string;
}

/**
 * Individual emoji reaction button with hover animation
 * Uses shadcn/ui Button primitive for accessibility
 */
export function ReactionButton({
	emoji,
	onClick,
	disabled = false,
	ariaLabel,
}: ReactionButtonProps) {
	return (
		<Button
			variant="ghost"
			size="icon-lg"
			onClick={onClick}
			disabled={disabled}
			aria-label={ariaLabel}
			className="text-4xl hover:scale-110 transition-transform min-h-12 min-w-12"
		>
			{emoji}
		</Button>
	);
}

"use client";

/**
 * Props for LiveMomentumInsight component
 */
export interface LiveMomentumInsightProps {
	/** ID of the game */
	gameId: string;
}

/**
 * Live Momentum Insight (Placeholder)
 *
 * Client Component that will show players with the most recent correct picks
 * during a live ceremony. This is Phase 1 - shows placeholder content only.
 * Phase 2 will fetch real momentum data via oRPC.
 *
 * @param props - Component props
 * @returns Placeholder insight card
 *
 * @example
 * ```typescript
 * <LiveMomentumInsight gameId="game-123" />
 * ```
 */
export function LiveMomentumInsight({ gameId }: LiveMomentumInsightProps) {
	return (
		<div>
			<h3 className="text-lg font-semibold mb-4 text-gray-900">Momentum Leaders</h3>
			<p className="text-gray-600">
				[Placeholder] Shows players with most recent correct picks
			</p>
			<p className="text-sm text-gray-500 mt-2">Game ID: {gameId}</p>
		</div>
	);
}

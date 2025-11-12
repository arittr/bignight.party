"use client";

/**
 * Props for LivePickDistributionInsight component
 */
export interface LivePickDistributionInsightProps {
	/** ID of the game */
	gameId: string;
}

/**
 * Live Pick Distribution Insight (Placeholder)
 *
 * Client Component that will show the most popular picks per category
 * during a live ceremony. This is Phase 1 - shows placeholder content only.
 * Phase 2 will fetch real pick distribution data via oRPC.
 *
 * @param props - Component props
 * @returns Placeholder insight card
 *
 * @example
 * ```typescript
 * <LivePickDistributionInsight gameId="game-123" />
 * ```
 */
export function LivePickDistributionInsight({ gameId }: LivePickDistributionInsightProps) {
	return (
		<div>
			<h3 className="text-lg font-semibold mb-4 text-gray-900">Pick Distribution</h3>
			<p className="text-gray-600">
				[Placeholder] Shows most popular picks per category
			</p>
			<p className="text-sm text-gray-500 mt-2">Game ID: {gameId}</p>
		</div>
	);
}

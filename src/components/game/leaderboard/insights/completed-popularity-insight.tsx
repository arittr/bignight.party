"use client";

/**
 * Props for CompletedPopularityInsight component
 */
export interface CompletedPopularityInsightProps {
	/** ID of the game */
	gameId: string;
}

/**
 * Completed Popularity Insight (Placeholder)
 *
 * Client Component that will show the contrast between most picked vs least picked winners
 * after a game completes. This is Phase 1 - shows placeholder content only.
 * Phase 2 will fetch real popularity data via oRPC.
 *
 * @param props - Component props
 * @returns Placeholder insight card
 *
 * @example
 * ```typescript
 * <CompletedPopularityInsight gameId="game-123" />
 * ```
 */
export function CompletedPopularityInsight({ gameId }: CompletedPopularityInsightProps) {
	return (
		<div>
			<h3 className="text-lg font-semibold mb-4 text-gray-900">Popularity Contest</h3>
			<p className="text-gray-600">
				[Placeholder] Shows most picked vs least picked winners
			</p>
			<p className="text-sm text-gray-500 mt-2">Game ID: {gameId}</p>
		</div>
	);
}

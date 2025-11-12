"use client";

/**
 * Props for CompletedSurprisesInsight component
 */
export interface CompletedSurprisesInsightProps {
	/** ID of the game */
	gameId: string;
}

/**
 * Completed Surprises Insight (Placeholder)
 *
 * Client Component that will show the biggest upsets - winners with the fewest picks
 * after a game completes. This is Phase 1 - shows placeholder content only.
 * Phase 2 will fetch real upset data via oRPC.
 *
 * @param props - Component props
 * @returns Placeholder insight card
 *
 * @example
 * ```typescript
 * <CompletedSurprisesInsight gameId="game-123" />
 * ```
 */
export function CompletedSurprisesInsight({ gameId }: CompletedSurprisesInsightProps) {
	return (
		<div>
			<h3 className="text-lg font-semibold mb-4 text-gray-900">Biggest Upsets</h3>
			<p className="text-gray-600">
				[Placeholder] Shows winners with fewest picks
			</p>
			<p className="text-sm text-gray-500 mt-2">Game ID: {gameId}</p>
		</div>
	);
}

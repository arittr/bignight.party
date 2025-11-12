"use client";

/**
 * Props for CompletedAccuracyInsight component
 */
export interface CompletedAccuracyInsightProps {
	/** ID of the game */
	gameId: string;
}

/**
 * Completed Accuracy Insight (Placeholder)
 *
 * Client Component that will show players with the highest correct percentage
 * after a game completes. This is Phase 1 - shows placeholder content only.
 * Phase 2 will fetch real accuracy data via oRPC.
 *
 * @param props - Component props
 * @returns Placeholder insight card
 *
 * @example
 * ```typescript
 * <CompletedAccuracyInsight gameId="game-123" />
 * ```
 */
export function CompletedAccuracyInsight({ gameId }: CompletedAccuracyInsightProps) {
	return (
		<div>
			<h3 className="text-lg font-semibold mb-4 text-gray-900">Top Accuracy</h3>
			<p className="text-gray-600">
				[Placeholder] Shows players with highest correct percentage
			</p>
			<p className="text-sm text-gray-500 mt-2">Game ID: {gameId}</p>
		</div>
	);
}

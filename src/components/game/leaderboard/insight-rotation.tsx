"use client";

import { useEffect, useState } from "react";
import type { GameStatus } from "@prisma/client";
import { CompletedAccuracyInsight } from "./insights/completed-accuracy-insight";
import { CompletedPopularityInsight } from "./insights/completed-popularity-insight";
import { CompletedSurprisesInsight } from "./insights/completed-surprises-insight";
import { LiveMomentumInsight } from "./insights/live-momentum-insight";
import { LivePickDistributionInsight } from "./insights/live-pick-distribution-insight";

/**
 * Props for InsightRotation component
 */
export interface InsightRotationProps {
	/** ID of the game */
	gameId: string;
	/** Current status of the game (LIVE or COMPLETED) */
	gameStatus: GameStatus;
}

/**
 * Rotating insight card display for leaderboard
 *
 * Client Component that cycles through different insight cards based on game status.
 * LIVE games show momentum and pick distribution. COMPLETED games show accuracy,
 * popularity, and surprises. Cards rotate every 15 seconds with fade transitions.
 *
 * Phase 1: All insights are placeholder stubs. Phase 2 will add real data via oRPC.
 *
 * @param props - Component props
 * @returns Rotating insight card display
 *
 * @example
 * ```typescript
 * <InsightRotation gameId="game-123" gameStatus="LIVE" />
 * ```
 */
export function InsightRotation({ gameId, gameStatus }: InsightRotationProps) {
	const [currentIndex, setCurrentIndex] = useState(0);

	// Define card sets by game status
	const liveInsights = [
		<LiveMomentumInsight key="momentum" gameId={gameId} />,
		<LivePickDistributionInsight key="distribution" gameId={gameId} />,
	];

	const completedInsights = [
		<CompletedAccuracyInsight key="accuracy" gameId={gameId} />,
		<CompletedPopularityInsight key="popularity" gameId={gameId} />,
		<CompletedSurprisesInsight key="surprises" gameId={gameId} />,
	];

	const insights = gameStatus === "COMPLETED" ? completedInsights : liveInsights;

	// Rotate every 15 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % insights.length);
		}, 15000);

		return () => clearInterval(interval);
	}, [insights.length]);

	return (
		<div className="w-full bg-white border rounded-lg p-6 shadow">
			<div className="transition-opacity duration-500">{insights[currentIndex]}</div>
		</div>
	);
}

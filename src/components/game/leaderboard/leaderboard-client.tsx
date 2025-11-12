"use client";

import type { GameStatus } from "@prisma/client";
import { useLeaderboardSocket } from "@/hooks/game/use-leaderboard-socket";
import { useReactions } from "@/hooks/game/use-reactions";
import type { LeaderboardPlayer } from "@/types/leaderboard";
import { ConnectionStatus } from "./connection-status";
import { GameHeader } from "./game-header";
import { InsightRotation } from "./insight-rotation";
import { LeaderboardList } from "./leaderboard-list";
import { ReactionBar } from "./reaction-bar";
import { ReactionDisplay } from "./reaction-display";

/**
 * Props for LeaderboardClient component
 */
export interface LeaderboardClientProps {
	/** ID of the game */
	gameId: string;
	/** Initial player data from SSR */
	initialPlayers: LeaderboardPlayer[];
	/** Initial game status from SSR */
	initialGameStatus: GameStatus;
	/** Name of the game */
	gameName: string;
	/** Name of the event */
	eventName: string;
	/** Current user's ID for highlighting reactions */
	currentUserId: string;
}

/**
 * Client-side orchestrator for the leaderboard
 *
 * Client Component that manages WebSocket connection and coordinates all
 * leaderboard child components. Receives initial SSR data and updates
 * in real-time via WebSocket.
 *
 * @param props - Component props
 * @returns Complete leaderboard UI with live updates
 *
 * @example
 * ```typescript
 * <LeaderboardClient
 *   gameId="game-123"
 *   initialPlayers={players}
 *   gameName="My Game"
 *   eventName="97th Academy Awards"
 * />
 * ```
 */
export function LeaderboardClient({
	gameId,
	initialPlayers,
	initialGameStatus,
	gameName,
	eventName,
	currentUserId,
}: LeaderboardClientProps) {
	// Connect to WebSocket and get live updates (including game status)
	const { players, connectionStatus, gameStatus } = useLeaderboardSocket(
		gameId,
		initialPlayers,
		initialGameStatus
	);

	// Connect to reactions WebSocket
	const { reactions, sendReaction } = useReactions(gameId);

	return (
		<div className="container relative mx-auto max-w-4xl px-4 py-8">
			{/* Game header with connection status */}
			<GameHeader
				connectionStatus={<ConnectionStatus status={connectionStatus} />}
				eventName={eventName}
				gameName={gameName}
			/>

			{/* Floating reaction display overlay */}
			<ReactionDisplay currentUserId={currentUserId} reactions={reactions} />

			{/* Player list with live updates */}
			<LeaderboardList players={players} />

			{/* Insight rotation cards (below scoreboard on mobile, beside on desktop) */}
			<div className="mt-8">
				<InsightRotation gameId={gameId} gameStatus={gameStatus} />
			</div>

			{/* Reaction buttons at bottom */}
			<ReactionBar
				disabled={connectionStatus !== "connected"}
				onReactionClick={sendReaction}
			/>
		</div>
	);
}

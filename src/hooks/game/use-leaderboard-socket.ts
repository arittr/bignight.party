"use client";

import type { GameStatus } from "@prisma/client";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { LEADERBOARD_EVENTS } from "@/lib/websocket/events";
import type {
	GameCompletedPayload,
	LeaderboardErrorPayload,
	LeaderboardPlayer,
	LeaderboardUpdatePayload,
} from "@/types/leaderboard";

/**
 * Connection status for WebSocket
 */
export type ConnectionStatus = "connected" | "connecting" | "disconnected";

/**
 * Return type for useLeaderboardSocket hook
 */
export interface UseLeaderboardSocketReturn {
	/** Current list of players with scores */
	players: LeaderboardPlayer[];
	/** Current connection status */
	connectionStatus: ConnectionStatus;
	/** Current game status (SETUP, OPEN, LIVE, or COMPLETED) */
	gameStatus: GameStatus;
}

/**
 * Custom hook for managing WebSocket connection and leaderboard updates
 *
 * Connects to Socket.io server, joins game room, and listens for real-time
 * leaderboard updates. Automatically handles reconnection and cleanup.
 * Tracks game status and updates when game completes via WebSocket.
 *
 * @param gameId - ID of the game to join
 * @param initialData - Initial player data from SSR (used until first WebSocket update)
 * @param initialGameStatus - Initial game status from SSR (used until first WebSocket update)
 * @returns Object with players array, connection status, and game status
 *
 * @example
 * ```typescript
 * const { players, connectionStatus, gameStatus } = useLeaderboardSocket(
 *   "game-123",
 *   initialPlayers,
 *   "LIVE"
 * );
 * ```
 */
export function useLeaderboardSocket(
	gameId: string,
	initialData: LeaderboardPlayer[],
	initialGameStatus: GameStatus
): UseLeaderboardSocketReturn {
	const [players, setPlayers] = useState<LeaderboardPlayer[]>(initialData);
	const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
	const [gameStatus, setGameStatus] = useState<GameStatus>(initialGameStatus);

  useEffect(() => {
    let socket: Socket | null = null;

    // Initialize socket connection
    const initializeSocket = () => {
      // Create socket connection
      socket = io({
        // Socket.io will use the same origin by default
        autoConnect: true,
      });

      // Handle successful connection
      socket.on("connect", () => {
        setConnectionStatus("connected");

        // Join the game room
        socket?.emit(LEADERBOARD_EVENTS.JOIN, { gameId });
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        setConnectionStatus("disconnected");
      });

      // Handle reconnection attempts
      socket.io.on("reconnect_attempt", () => {
        setConnectionStatus("connecting");
      });

      // Handle reconnection success
      socket.io.on("reconnect", () => {
        setConnectionStatus("connected");

        // Rejoin the game room after reconnection
        socket?.emit(LEADERBOARD_EVENTS.JOIN, { gameId });
      });

			// Handle leaderboard updates
			socket.on(LEADERBOARD_EVENTS.UPDATE, (payload: LeaderboardUpdatePayload) => {
				// Update players list with new data
				setPlayers(payload.players);
			});

			// Handle game completion
			socket.on(LEADERBOARD_EVENTS.GAME_COMPLETED, (payload: GameCompletedPayload) => {
				// Update game status to COMPLETED
				setGameStatus("COMPLETED");
				// biome-ignore lint/suspicious/noConsole: Status change logging for debugging
				console.log("[useLeaderboardSocket] Game completed:", payload.gameId);
			});

			// Handle errors
			socket.on(LEADERBOARD_EVENTS.ERROR, (error: LeaderboardErrorPayload) => {
				// biome-ignore lint/suspicious/noConsole: Error logging for debugging WebSocket issues
				console.error("[useLeaderboardSocket] Error:", error.message, error.code);
			});

      // Handle connection errors
      socket.on("connect_error", (error) => {
        // biome-ignore lint/suspicious/noConsole: Error logging for debugging WebSocket issues
        console.error("[useLeaderboardSocket] Connection error:", error.message);
        setConnectionStatus("disconnected");
      });
    };

    // Initialize socket
    initializeSocket();

		// Cleanup on unmount
		return () => {
			if (socket) {
				socket.disconnect();
				socket = null;
			}
		};
	}, [gameId]);

	return { connectionStatus, gameStatus, players };
}

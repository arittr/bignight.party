"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { LEADERBOARD_EVENTS } from "@/lib/websocket/events";
import type {
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
}

/**
 * Custom hook for managing WebSocket connection and leaderboard updates
 *
 * Connects to Socket.io server, joins game room, and listens for real-time
 * leaderboard updates. Automatically handles reconnection and cleanup.
 *
 * @param gameId - ID of the game to join
 * @param initialData - Initial player data from SSR (used until first WebSocket update)
 * @returns Object with players array and connection status
 *
 * @example
 * ```typescript
 * const { players, connectionStatus } = useLeaderboardSocket(
 *   "game-123",
 *   initialPlayers
 * );
 * ```
 */
export function useLeaderboardSocket(
  gameId: string,
  initialData: LeaderboardPlayer[]
): UseLeaderboardSocketReturn {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>(initialData);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");

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

  return { connectionStatus, players };
}

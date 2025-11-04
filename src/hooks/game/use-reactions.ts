"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { LEADERBOARD_EVENTS } from "@/lib/websocket/events";
import type { Reaction, ReactionPayload } from "@/types/leaderboard";

/**
 * Return type for useReactions hook
 */
export interface UseReactionsReturn {
	/** Current list of active reactions */
	reactions: Reaction[];
	/** Function to send a reaction */
	sendReaction: (emoji: string) => void;
}

/**
 * Custom hook for managing WebSocket-based reactions with auto-cleanup
 *
 * Connects to Socket.io server, joins game room, and listens for reaction
 * broadcasts. Each reaction is automatically removed after 3 seconds using
 * cleanup timers. Follows the same connection pattern as useLeaderboardSocket.
 *
 * @param gameId - ID of the game to join
 * @returns Object with reactions array and sendReaction function
 *
 * @example
 * ```typescript
 * const { reactions, sendReaction } = useReactions("game-123");
 *
 * // Send a reaction
 * sendReaction("🎉");
 * ```
 */
export function useReactions(gameId: string): UseReactionsReturn {
	const [reactions, setReactions] = useState<Reaction[]>([]);
	const socketRef = useRef<Socket | null>(null);
	const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

	/**
	 * Remove a reaction by ID and clear its timer
	 */
	const removeReaction = useCallback((reactionId: string) => {
		// Clear timer from map
		const timer = timersRef.current.get(reactionId);
		if (timer) {
			clearTimeout(timer);
			timersRef.current.delete(reactionId);
		}

		// Remove from reactions state
		setReactions((prev) => prev.filter((r) => r.id !== reactionId));
	}, []);

	/**
	 * Send a reaction to the server
	 */
	const sendReaction = useCallback(
		(emoji: string) => {
			if (socketRef.current?.connected) {
				socketRef.current.emit(LEADERBOARD_EVENTS.REACTION_SEND, {
					emoji,
					gameId,
				});
			}
		},
		[gameId]
	);

	useEffect(() => {
		// Initialize socket connection
		const socket = io({
			// Socket.io will use the same origin by default
			autoConnect: true,
		});

		socketRef.current = socket;

		// Handle successful connection
		socket.on("connect", () => {
			// Join the game room
			socket.emit(LEADERBOARD_EVENTS.JOIN, { gameId });
		});

		// Handle reconnection success
		socket.io.on("reconnect", () => {
			// Rejoin the game room after reconnection
			socket.emit(LEADERBOARD_EVENTS.JOIN, { gameId });
		});

		// Handle reaction broadcasts
		socket.on(LEADERBOARD_EVENTS.REACTION_BROADCAST, (payload: ReactionPayload) => {
			// Generate unique ID for this reaction
			const reactionId = crypto.randomUUID();

			// Create reaction object with unique ID
			const reaction: Reaction = {
				...payload,
				id: reactionId,
			};

			// Add to reactions state
			setReactions((prev) => [...prev, reaction]);

			// Set 3-second cleanup timer
			const timer = setTimeout(() => {
				removeReaction(reactionId);
			}, 3000);

			// Store timer in map for manual cleanup
			timersRef.current.set(reactionId, timer);
		});

		// Cleanup on unmount
		return () => {
			// Clear all timers
			for (const timer of Array.from(timersRef.current.values())) {
				clearTimeout(timer);
			}
			timersRef.current.clear();

			// Disconnect socket
			socket.disconnect();
			socketRef.current = null;
		};
	}, [gameId, removeReaction]);

	return { reactions, sendReaction };
}

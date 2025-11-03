/**
 * Socket.io server initialization and connection management
 *
 * This module provides a singleton Socket.io server instance for real-time
 * communication. It handles:
 * - Server initialization with CORS configuration
 * - Connection validation (user session check)
 * - Room management (joining game rooms with participant verification)
 * - Helper functions for services to emit events
 *
 * IMPORTANT: Socket.io requires a custom Next.js server setup.
 * This is not compatible with `next start` - requires custom server.js file.
 *
 * Development: Works with `next dev` when server.js is properly configured
 * Production: Requires custom server setup for Socket.io attachment
 */

import type { Server as HTTPServer } from "node:http";
import { Server } from "socket.io";
import * as gameParticipantModel from "@/lib/models/game-participant";
import * as userModel from "@/lib/models/user";
import type {
  JoinRoomPayload,
  LeaderboardErrorPayload,
  LeaderboardUpdatePayload,
  ReactionSendPayload,
} from "@/types/leaderboard";
import { LEADERBOARD_EVENTS } from "./events";

/**
 * Singleton Socket.io server instance
 */
let io: Server | undefined;

/**
 * Allowed emoji reactions
 */
const ALLOWED_EMOJIS = ["🔥", "😍", "😱", "💀"] as const;

/**
 * Session data passed from client in socket.handshake.auth
 */
interface SocketAuth {
  /** User ID from session token */
  userId?: string;
  /** Session token (optional, for future JWT validation) */
  token?: string;
}

/**
 * Extended socket interface with typed auth data
 */
interface AuthenticatedSocket {
  id: string;
  handshake: {
    auth: SocketAuth;
  };
  join: (room: string) => void;
  emit: (event: string, data: unknown) => void;
  disconnect: (close?: boolean) => void;
  // biome-ignore lint/suspicious/noExplicitAny: Socket.io event handlers can have any signature
  on: (event: string, handler: (...args: any[]) => void) => void;
}

/**
 * Get or create the Socket.io server singleton
 *
 * @param httpServer - Optional HTTP server to attach Socket.io to (first call only)
 * @returns Socket.io server instance
 *
 * @example
 * ```typescript
 * // In custom server.js
 * const server = createServer(nextHandler);
 * const io = getSocketServer(server);
 * ```
 */
export function getSocketServer(httpServer?: HTTPServer): Server {
  if (!io) {
    if (!httpServer) {
      throw new Error("Socket.io server not initialized. Pass httpServer on first call.");
    }

    io = new Server(httpServer, {
      cors: {
        credentials: true,
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      },
      path: "/socket.io/",
    });

    // Set up connection handler
    setupConnectionHandler(io);
  }

  return io;
}

/**
 * Set up Socket.io connection handler with authentication and room management
 */
function setupConnectionHandler(server: Server): void {
  server.on("connection", async (socket) => {
    const authSocket = socket as unknown as AuthenticatedSocket;

    // Validate user session
    const userId = authSocket.handshake.auth.userId;

    if (!userId) {
      emitError(authSocket.id, {
        code: "AUTH_REQUIRED",
        message: "Authentication required",
      });
      authSocket.disconnect(true);
      return;
    }

    // Verify user exists in database
    const userExists = await userModel.exists(userId);

    if (!userExists) {
      emitError(authSocket.id, {
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
      authSocket.disconnect(true);
      return;
    }

    // biome-ignore lint/suspicious/noConsole: WebSocket connection logging is intentional for debugging
    console.log(`[WebSocket] User ${userId} connected (socket: ${authSocket.id})`);

    // Handle join room request
    authSocket.on("join", async (payload: JoinRoomPayload) => {
      try {
        const { gameId } = payload;

        if (!gameId) {
          emitError(authSocket.id, {
            code: "GAME_ID_REQUIRED",
            message: "Game ID is required",
          });
          return;
        }

        // Verify user is a participant in this game
        const isParticipant = await gameParticipantModel.exists(userId, gameId);

        if (!isParticipant) {
          emitError(authSocket.id, {
            code: "NOT_PARTICIPANT",
            message: "You are not a participant in this game",
          });
          return;
        }

        // Join the game room
        authSocket.join(gameId);
        // biome-ignore lint/suspicious/noConsole: WebSocket room join logging is intentional for debugging
        console.log(`[WebSocket] User ${userId} joined game room ${gameId}`);

        // Emit confirmation (optional, for client-side feedback)
        authSocket.emit("joined", { gameId });
      } catch (error) {
        // biome-ignore lint/suspicious/noConsole: WebSocket error logging is intentional for debugging
        console.error("[WebSocket] Error joining room:", error);
        emitError(authSocket.id, {
          code: "JOIN_FAILED",
          message: "Failed to join game room",
        });
      }
    });

    // Handle reaction send request
    authSocket.on(LEADERBOARD_EVENTS.REACTION_SEND, async (payload: ReactionSendPayload) => {
      try {
        const { emoji, gameId } = payload;

        // Validate emoji is allowed
        if (!ALLOWED_EMOJIS.includes(emoji as (typeof ALLOWED_EMOJIS)[number])) {
          emitError(authSocket.id, {
            code: "INVALID_EMOJI",
            message: "Invalid emoji. Allowed emojis: 🔥, 😍, 😱, 💀",
          });
          return;
        }

        // Validate gameId exists
        if (!gameId) {
          emitError(authSocket.id, {
            code: "GAME_ID_REQUIRED",
            message: "Game ID is required",
          });
          return;
        }

        // Verify user is a participant in this game
        const isParticipant = await gameParticipantModel.exists(userId, gameId);

        if (!isParticipant) {
          emitError(authSocket.id, {
            code: "NOT_PARTICIPANT",
            message: "You are not a participant in this game",
          });
          return;
        }

        // Fetch user name
        const user = await userModel.findById(userId);

        if (!user) {
          emitError(authSocket.id, {
            code: "USER_NOT_FOUND",
            message: "User not found",
          });
          return;
        }

        // Broadcast reaction to game room
        if (io) {
          io.to(gameId).emit(LEADERBOARD_EVENTS.REACTION_BROADCAST, {
            emoji,
            gameId,
            timestamp: Date.now(),
            userId,
            userName: user.name || user.email,
          });
          // biome-ignore lint/suspicious/noConsole: Reaction broadcast logging is intentional for debugging
          console.log(`[WebSocket] User ${userId} sent reaction ${emoji} to game ${gameId}`);
        }
      } catch (error) {
        // biome-ignore lint/suspicious/noConsole: WebSocket error logging is intentional for debugging
        console.error("[WebSocket] Error handling reaction:", error);
        emitError(authSocket.id, {
          code: "REACTION_FAILED",
          message: "Failed to send reaction",
        });
      }
    });

    // Handle disconnect
    authSocket.on("disconnect", () => {
      // biome-ignore lint/suspicious/noConsole: WebSocket disconnect logging is intentional for debugging
      console.log(`[WebSocket] User ${userId} disconnected (socket: ${authSocket.id})`);
    });
  });
}

/**
 * Emit a leaderboard update to all clients in a game room
 *
 * This is the primary function used by services to broadcast leaderboard
 * updates when winners are revealed.
 *
 * @param gameId - Game ID (room name)
 * @param data - Leaderboard update payload
 *
 * @example
 * ```typescript
 * // In leaderboard service after calculating new scores
 * emitLeaderboardUpdate(gameId, {
 *   players: updatedPlayers,
 *   gameId,
 *   timestamp: Date.now(),
 * });
 * ```
 */
export function emitLeaderboardUpdate(gameId: string, data: LeaderboardUpdatePayload): void {
  if (!io) {
    // biome-ignore lint/suspicious/noConsole: Warning about uninitialized server is intentional
    console.warn("[WebSocket] Cannot emit leaderboard update - server not initialized");
    return;
  }

  io.to(gameId).emit(LEADERBOARD_EVENTS.UPDATE, data);
  // biome-ignore lint/suspicious/noConsole: Broadcast logging is intentional for debugging
  console.log(`[WebSocket] Emitted leaderboard update to game ${gameId}`);
}

/**
 * Emit an error message to a specific client socket
 *
 * @param socketId - Socket ID to send error to
 * @param error - Error payload with message and code
 *
 * @example
 * ```typescript
 * emitError(socket.id, {
 *   message: "You are not authorized to join this game",
 *   code: "UNAUTHORIZED",
 * });
 * ```
 */
export function emitError(socketId: string, error: LeaderboardErrorPayload): void {
  if (!io) {
    // biome-ignore lint/suspicious/noConsole: Warning about uninitialized server is intentional
    console.warn("[WebSocket] Cannot emit error - server not initialized");
    return;
  }

  io.to(socketId).emit(LEADERBOARD_EVENTS.ERROR, error);
}

/**
 * Clean up Socket.io server (for testing and hot reload)
 */
export function closeSocketServer(): void {
  if (io) {
    io.close();
    io = undefined;
    // biome-ignore lint/suspicious/noConsole: Server close logging is intentional for debugging
    console.log("[WebSocket] Server closed");
  }
}

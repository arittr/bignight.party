import { Server } from "socket.io";
import { eq } from "drizzle-orm";
import { ALLOWED_REACTIONS, WEBSOCKET_EVENTS } from "@bignight/shared";
import { verifyToken } from "../auth/token";
import { players } from "../db/schema";
import type { Db } from "../db/connection";

const GAME_ROOM = "game";

/**
 * Attaches auth middleware and game event handlers to a Socket.io Server instance.
 * The caller is responsible for binding the Server to a transport (http.Server or bun-engine).
 */
export function configureSocketServer(io: Server, db?: Db): void {
  // Auth middleware: validate JWT from handshake
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return next(new Error("Invalid or expired token"));
    }
    socket.data.playerId = payload.playerId;
    socket.data.isAdmin = payload.isAdmin;

    // Look up player name from DB if available
    if (db && payload.playerId !== "admin") {
      const result = await db.select({ name: players.name }).from(players).where(eq(players.id, payload.playerId)).limit(1);
      socket.data.playerName = result[0]?.name ?? "Player";
    } else {
      socket.data.playerName = payload.isAdmin ? "Admin" : "Player";
    }

    next();
  });

  io.on("connection", (socket) => {
    socket.join(GAME_ROOM);

    socket.on(WEBSOCKET_EVENTS.REACTION_SEND, (data: unknown) => {
      if (!data || typeof data !== "object" || !("emoji" in data)) return;
      const { emoji } = data as { emoji: string };
      if (!(ALLOWED_REACTIONS as readonly string[]).includes(emoji)) return;

      io.to(GAME_ROOM).emit(WEBSOCKET_EVENTS.REACTION_BROADCAST, {
        playerId: socket.data.playerId,
        name: socket.data.playerName ?? "Player",
        emoji,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      });
    });
  });
}

/**
 * Creates a Socket.io server attached to a Node http.Server.
 * Used in tests (vitest runs under Node) and can be used in dev/preview mode.
 */
export function createSocketServer(httpServer: import("node:http").Server): Server {
  const io = new Server(httpServer, { cors: { origin: "*" } });
  configureSocketServer(io);
  return io;
}

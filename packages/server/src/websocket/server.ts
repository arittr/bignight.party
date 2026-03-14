import { Server } from "socket.io";
import { ALLOWED_REACTIONS, WEBSOCKET_EVENTS } from "@bignight/shared";
import { verifyToken } from "../auth/token";

const GAME_ROOM = "game";

/**
 * Attaches auth middleware and game event handlers to a Socket.io Server instance.
 * The caller is responsible for binding the Server to a transport (http.Server or bun-engine).
 */
export function configureSocketServer(io: Server): void {
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
    next();
  });

  io.on("connection", (socket) => {
    socket.join(GAME_ROOM);

    socket.on(WEBSOCKET_EVENTS.REACTION_SEND, (emoji: unknown) => {
      if (typeof emoji !== "string" || !(ALLOWED_REACTIONS as readonly string[]).includes(emoji)) {
        return;
      }
      io.to(GAME_ROOM).emit(WEBSOCKET_EVENTS.REACTION_BROADCAST, emoji);
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

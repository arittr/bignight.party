import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(token: string): Socket {
  if (socket && currentToken !== token) {
    socket.disconnect();
    socket = null;
  }
  currentToken = token;
  if (socket?.connected) return socket;

  socket = io({ auth: { token }, autoConnect: true, reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 1000 });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

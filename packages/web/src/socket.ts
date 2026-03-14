// TODO: Implement full socket management in socket task
// Stub for hook imports

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io({ auth: { token } });
  }
  return socket;
}

import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { io as ioClient, type Socket } from "socket.io-client";
import { ALLOWED_REACTIONS, WEBSOCKET_EVENTS } from "@bignight/shared";
import { signToken } from "../../auth/token";
import { createSocketServer } from "../server";

function startTestServer(): { port: number; stop: () => Promise<void> } {
  const httpServer = createServer();
  createSocketServer(httpServer);

  return {
    port: 0, // resolved after listen
    stop: () =>
      new Promise((resolve, reject) => httpServer.close((err) => (err ? reject(err) : resolve()))),
  };
}

function connectClient(port: number, token?: string): Socket {
  return ioClient(`http://localhost:${port}`, {
    transports: ["websocket"],
    auth: token ? { token } : {},
  });
}

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
}

function waitForEvent(socket: Socket, event: string): Promise<unknown> {
  return new Promise((resolve) => {
    socket.once(event, resolve);
  });
}

describe("WebSocket server", () => {
  let port: number;
  let stopServer: () => Promise<void>;
  let validToken: string;

  beforeAll(
    () =>
      new Promise<void>((resolve) => {
        validToken = "";
        const httpServer = createServer();
        createSocketServer(httpServer);

        httpServer.listen(0, async () => {
          const addr = httpServer.address();
          port = typeof addr === "object" && addr ? addr.port : 0;
          validToken = await signToken({ playerId: "player_1", isAdmin: false });
          stopServer = () =>
            new Promise((res, rej) => httpServer.close((err) => (err ? rej(err) : res())));
          resolve();
        });
      }),
  );

  afterAll(async () => {
    await stopServer();
  });

  it("accepts connection with valid auth token", async () => {
    const socket = connectClient(port, validToken);
    await expect(waitForConnect(socket)).resolves.toBeUndefined();
    socket.disconnect();
  });

  it("rejects connection without auth token", async () => {
    const socket = connectClient(port);
    await expect(waitForConnect(socket)).rejects.toMatchObject({
      message: expect.stringContaining("Authentication required"),
    });
    socket.disconnect();
  });

  it("rejects connection with invalid token", async () => {
    const socket = connectClient(port, "garbage.token.here");
    await expect(waitForConnect(socket)).rejects.toMatchObject({
      message: expect.stringContaining("Invalid or expired token"),
    });
    socket.disconnect();
  });

  it("broadcasts a valid reaction emoji to all clients in the game room", async () => {
    const token2 = await signToken({ playerId: "player_2", isAdmin: false });

    const sender = connectClient(port, validToken);
    const receiver = connectClient(port, token2);

    await Promise.all([waitForConnect(sender), waitForConnect(receiver)]);

    const broadcastPromise = waitForEvent(receiver, WEBSOCKET_EVENTS.REACTION_BROADCAST);
    sender.emit(WEBSOCKET_EVENTS.REACTION_SEND, ALLOWED_REACTIONS[0]);

    const received = await broadcastPromise;
    expect(received).toBe(ALLOWED_REACTIONS[0]);

    sender.disconnect();
    receiver.disconnect();
  });

  it("does not broadcast an invalid reaction emoji", async () => {
    const socket = connectClient(port, validToken);
    await waitForConnect(socket);

    let broadcastReceived = false;
    socket.on(WEBSOCKET_EVENTS.REACTION_BROADCAST, () => {
      broadcastReceived = true;
    });

    socket.emit(WEBSOCKET_EVENTS.REACTION_SEND, "👍");

    // Wait briefly to confirm no broadcast arrives
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(broadcastReceived).toBe(false);

    socket.disconnect();
  });
});

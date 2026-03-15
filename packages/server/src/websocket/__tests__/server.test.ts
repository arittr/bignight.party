import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { io as ioClient, type Socket } from "socket.io-client";
import { eq } from "drizzle-orm";
import { Server } from "socket.io";
import { ALLOWED_REACTIONS, WEBSOCKET_EVENTS } from "@bignight/shared";
import { createId } from "@paralleldrive/cuid2";
import { signToken } from "../../auth/token";
import { createTestDb } from "../../db/connection";
import { categories, nominations, picks, players } from "../../db/schema";
import { createSocketServer, configureSocketServer } from "../server";
import type { Db } from "../../db/connection";

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
    sender.emit(WEBSOCKET_EVENTS.REACTION_SEND, { emoji: ALLOWED_REACTIONS[0] });

    const received = (await broadcastPromise) as Record<string, unknown>;
    expect(received).toMatchObject({
      playerId: "player_1",
      emoji: ALLOWED_REACTIONS[0],
    });
    expect(received.id).toEqual(expect.any(String));
    expect(received.timestamp).toEqual(expect.any(Number));

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

describe("Reaction broadcast rank field", () => {
  let port: number;
  let stopServer: () => Promise<void>;
  let validToken: string;

  beforeAll(
    () =>
      new Promise<void>((resolve) => {
        const httpServer = createServer();
        createSocketServer(httpServer); // no db → rank should be null

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

  it("includes rank: null when no db is available", async () => {
    const sender = connectClient(port, validToken);
    await waitForConnect(sender);

    const broadcastPromise = waitForEvent(sender, WEBSOCKET_EVENTS.REACTION_BROADCAST);
    sender.emit(WEBSOCKET_EVENTS.REACTION_SEND, { emoji: ALLOWED_REACTIONS[0] });

    const received = (await broadcastPromise) as Record<string, unknown>;
    expect(received).toMatchObject({
      playerId: "player_1",
      emoji: ALLOWED_REACTIONS[0],
      rank: null,
    });
    expect(received.id).toEqual(expect.any(String));
    expect(received.timestamp).toEqual(expect.any(Number));

    sender.disconnect();
  });
});

describe("Reaction broadcast with db", () => {
  let port: number;
  let stopServer: () => Promise<void>;
  let db: Db;
  let playerToken: string;
  let testPlayerId: string;

  beforeAll(async () => {
    db = createTestDb();

    // Insert order respects FK constraints: category (no winner yet) -> nomination -> update category winner -> player -> pick
    const catId = createId();
    const nomId = createId();
    testPlayerId = createId();

    await db.insert(categories).values({
      id: catId, name: "Best Picture", order: 0, points: 1,
      winnerId: null, isRevealed: false, createdAt: Date.now(),
    });
    await db.insert(nominations).values({
      id: nomId, categoryId: catId, title: "Film A",
      subtitle: "", imageUrl: null, createdAt: Date.now(),
    });
    await db.update(categories)
      .set({ winnerId: nomId, isRevealed: true })
      .where(eq(categories.id, catId));
    await db.insert(players).values({
      id: testPlayerId, name: "Drew", pin: "hashed", createdAt: Date.now(),
    });
    await db.insert(picks).values({
      id: createId(), playerId: testPlayerId, categoryId: catId,
      nominationId: nomId, createdAt: Date.now(), updatedAt: Date.now(),
    });

    playerToken = await signToken({ playerId: testPlayerId, isAdmin: false });

    const httpServer = createServer();
    const io = new Server(httpServer, { cors: { origin: "*" } });
    configureSocketServer(io, db);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        port = typeof addr === "object" && addr ? addr.port : 0;
        stopServer = () =>
          new Promise((res, rej) => httpServer.close((err) => (err ? rej(err) : res())));
        resolve();
      });
    });
  });

  afterAll(async () => {
    await stopServer();
  });

  it("includes the player's current rank when db is available", async () => {
    const sender = connectClient(port, playerToken);
    await waitForConnect(sender);

    const broadcastPromise = waitForEvent(sender, WEBSOCKET_EVENTS.REACTION_BROADCAST);
    sender.emit(WEBSOCKET_EVENTS.REACTION_SEND, { emoji: ALLOWED_REACTIONS[0] });

    const received = (await broadcastPromise) as Record<string, unknown>;
    expect(received).toMatchObject({
      playerId: testPlayerId,
      name: "Drew",
      emoji: ALLOWED_REACTIONS[0],
      rank: 1,
    });

    sender.disconnect();
  });
});

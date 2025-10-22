/**
 * WebSocket Server Tests
 *
 * Tests for Socket.io server initialization, connection management,
 * and event emission using mocked dependencies.
 *
 * Note: These tests verify the core functionality but don't fully test
 * the socket connection lifecycle due to limitations in mocking Socket.io.
 * Manual integration testing is recommended for complete coverage.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as gameParticipantModel from "@/lib/models/game-participant";
import * as userModel from "@/lib/models/user";
import { LEADERBOARD_EVENTS } from "../events";
import { closeSocketServer, emitError, emitLeaderboardUpdate, getSocketServer } from "../server";

// Mock the models
vi.mock("@/lib/models/game-participant");
vi.mock("@/lib/models/user");

// Create reusable mock functions
let mockServerOn: ReturnType<typeof vi.fn>;
let mockServerTo: ReturnType<typeof vi.fn>;
let mockServerClose: ReturnType<typeof vi.fn>;
let mockEmit: ReturnType<typeof vi.fn>;

// Mock Socket.io module
vi.mock("socket.io", () => {
  return {
    // biome-ignore lint/style/useNamingConvention: Server is correct for Socket.io class mock
    Server: vi.fn().mockImplementation(() => {
      mockEmit = vi.fn();
      mockServerTo = vi.fn(() => ({ emit: mockEmit }));
      mockServerOn = vi.fn();
      mockServerClose = vi.fn();

      return {
        close: mockServerClose,
        on: mockServerOn,
        to: mockServerTo,
      };
    }),
  };
});

// Mock http server
const mockHttpServer = {} as any;

describe("getSocketServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    closeSocketServer(); // Reset singleton
  });

  it("creates Socket.io server on first call", async () => {
    const { Server } = await import("socket.io");

    const io = getSocketServer(mockHttpServer);

    expect(io).toBeDefined();
    expect(Server).toHaveBeenCalledWith(
      mockHttpServer,
      expect.objectContaining({
        cors: expect.objectContaining({
          credentials: true,
          origin: expect.any(String),
        }),
        path: "/socket.io/",
      })
    );
  });

  it("returns same instance on subsequent calls", () => {
    const io1 = getSocketServer(mockHttpServer);
    const io2 = getSocketServer();

    expect(io1).toBe(io2);
  });

  it("throws error if called without httpServer on first call", () => {
    expect(() => getSocketServer()).toThrow("Socket.io server not initialized");
  });

  it("sets up connection handler", () => {
    getSocketServer(mockHttpServer);

    expect(mockServerOn).toHaveBeenCalledWith("connection", expect.any(Function));
  });
});

describe("emitLeaderboardUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    closeSocketServer();
  });

  it("emits update event to game room", () => {
    getSocketServer(mockHttpServer);

    const payload = {
      gameId: "test-game-id",
      players: [
        {
          correctCount: 2,
          email: "user@example.com",
          image: null,
          isCurrentUser: false,
          name: "Test User",
          rank: 1,
          totalScore: 15,
          userId: "user-1",
        },
      ],
      timestamp: Date.now(),
    };

    emitLeaderboardUpdate("test-game-id", payload);

    expect(mockServerTo).toHaveBeenCalledWith("test-game-id");
    expect(mockEmit).toHaveBeenCalledWith(LEADERBOARD_EVENTS.UPDATE, payload);
  });

  it("handles emit when server not initialized", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    emitLeaderboardUpdate("test-game-id", {
      gameId: "test-game-id",
      players: [],
      timestamp: Date.now(),
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "[WebSocket] Cannot emit leaderboard update - server not initialized"
    );

    consoleSpy.mockRestore();
  });
});

describe("emitError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    closeSocketServer();
  });

  it("emits error event to specific socket", () => {
    getSocketServer(mockHttpServer);

    const error = {
      code: "NOT_PARTICIPANT",
      message: "You are not a participant in this game",
    };

    emitError("test-socket-id", error);

    expect(mockServerTo).toHaveBeenCalledWith("test-socket-id");
    expect(mockEmit).toHaveBeenCalledWith(LEADERBOARD_EVENTS.ERROR, error);
  });

  it("handles emit when server not initialized", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    emitError("test-socket-id", {
      code: "ERROR",
      message: "Error",
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "[WebSocket] Cannot emit error - server not initialized"
    );

    consoleSpy.mockRestore();
  });
});

describe("closeSocketServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("closes server and resets singleton", () => {
    getSocketServer(mockHttpServer);
    closeSocketServer();

    expect(mockServerClose).toHaveBeenCalled();
  });

  it("does nothing if server not initialized", () => {
    closeSocketServer(); // Should not throw
    expect(true).toBe(true); // Assertion to confirm no error
  });
});

describe("integration: connection handler behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    closeSocketServer();
    vi.mocked(userModel.exists).mockResolvedValue(true);
    vi.mocked(gameParticipantModel.exists).mockResolvedValue(true);
  });

  it("validates setup registers connection handler", () => {
    getSocketServer(mockHttpServer);

    // Verify connection handler was registered
    expect(mockServerOn).toHaveBeenCalledWith("connection", expect.any(Function));
  });

  /**
   * Note: Full integration testing of the connection handler requires
   * actual Socket.io connections. These tests verify the setup is correct,
   * but manual testing or E2E tests are needed to verify:
   * - Session validation logic
   * - Room joining with participant verification
   * - Disconnect handling
   * - Error emission to specific sockets
   */
});

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEADERBOARD_EVENTS } from "@/lib/websocket/events";
import type { LeaderboardPlayer, LeaderboardUpdatePayload } from "@/types/leaderboard";
import { useLeaderboardSocket } from "../use-leaderboard-socket";

// Mock socket.io-client
const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockDisconnect = vi.fn();
const mockIoOn = vi.fn();

const mockSocket = {
  disconnect: mockDisconnect,
  emit: mockEmit,
  io: {
    on: mockIoOn,
  },
  on: mockOn,
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

describe("useLeaderboardSocket", () => {
  const gameId = "game-123";
  const initialPlayers: LeaderboardPlayer[] = [
    {
      correctCount: 5,
      email: "alice@example.com",
      image: null,
      isCurrentUser: false,
      name: "Alice",
      rank: 1,
      totalScore: 100,
      userId: "user-1",
    },
    {
      correctCount: 4,
      email: "bob@example.com",
      image: null,
      isCurrentUser: true,
      name: "Bob",
      rank: 2,
      totalScore: 80,
      userId: "user-2",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("should initialize with initial data and connecting status", () => {
    const { result } = renderHook(() => useLeaderboardSocket(gameId, initialPlayers, "LIVE"));

    expect(result.current.players).toEqual(initialPlayers);
    expect(result.current.connectionStatus).toBe("connecting");
  });

  it("should set up socket event listeners on mount", () => {
    renderHook(() => useLeaderboardSocket(gameId, initialPlayers, "LIVE"));

    expect(mockOn).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith("disconnect", expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith(LEADERBOARD_EVENTS.UPDATE, expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith(LEADERBOARD_EVENTS.ERROR, expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith("connect_error", expect.any(Function));
    expect(mockIoOn).toHaveBeenCalledWith("reconnect_attempt", expect.any(Function));
    expect(mockIoOn).toHaveBeenCalledWith("reconnect", expect.any(Function));
  });

  it("should join game room on connect", () => {
    renderHook(() => useLeaderboardSocket(gameId, initialPlayers, "LIVE"));

    // Get the connect handler
    const connectHandler = mockOn.mock.calls.find((call) => call[0] === "connect")?.[1];

    // Trigger connect
    act(() => {
      connectHandler?.();
    });

    expect(mockEmit).toHaveBeenCalledWith(LEADERBOARD_EVENTS.JOIN, { gameId });
  });

  it("should update status to connected on connect", () => {
    const { result } = renderHook(() => useLeaderboardSocket(gameId, initialPlayers, "LIVE"));

    // Get the connect handler
    const connectHandler = mockOn.mock.calls.find((call) => call[0] === "connect")?.[1];

    // Trigger connect
    act(() => {
      connectHandler?.();
    });

    expect(result.current.connectionStatus).toBe("connected");
  });

  it("should update status to disconnected on disconnect", () => {
    const { result } = renderHook(() => useLeaderboardSocket(gameId, initialPlayers, "LIVE"));

    // Get the disconnect handler
    const disconnectHandler = mockOn.mock.calls.find((call) => call[0] === "disconnect")?.[1];

    // Trigger disconnect
    act(() => {
      disconnectHandler?.();
    });

    expect(result.current.connectionStatus).toBe("disconnected");
  });

  it("should update status to connecting on reconnect attempt", () => {
    const { result } = renderHook(() => useLeaderboardSocket(gameId, initialPlayers, "LIVE"));

    // Get the reconnect_attempt handler
    const reconnectHandler = mockIoOn.mock.calls.find(
      (call) => call[0] === "reconnect_attempt"
    )?.[1];

    // Trigger reconnect attempt
    act(() => {
      reconnectHandler?.();
    });

    expect(result.current.connectionStatus).toBe("connecting");
  });

  it("should rejoin room on reconnect", () => {
    renderHook(() => useLeaderboardSocket(gameId, initialPlayers, "LIVE"));

    // Get the reconnect handler
    const reconnectHandler = mockIoOn.mock.calls.find((call) => call[0] === "reconnect")?.[1];

    // Trigger reconnect
    act(() => {
      reconnectHandler?.();
    });

    expect(mockEmit).toHaveBeenCalledWith(LEADERBOARD_EVENTS.JOIN, { gameId });
  });

  it("should update players on leaderboard update event", () => {
    const { result } = renderHook(() => useLeaderboardSocket(gameId, initialPlayers, "LIVE"));

    // Get the update handler
    const updateHandler = mockOn.mock.calls.find(
      (call) => call[0] === LEADERBOARD_EVENTS.UPDATE
    )?.[1];

    const updatedPlayers: LeaderboardPlayer[] = [
      {
        correctCount: 6,
        email: "bob@example.com",
        image: null,
        isCurrentUser: true,
        name: "Bob",
        rank: 1,
        totalScore: 120,
        userId: "user-2",
      },
      {
        correctCount: 5,
        email: "alice@example.com",
        image: null,
        isCurrentUser: false,
        name: "Alice",
        rank: 2,
        totalScore: 100,
        userId: "user-1",
      },
    ];

    const payload: LeaderboardUpdatePayload = {
      gameId,
      players: updatedPlayers,
      timestamp: Date.now(),
    };

    // Trigger update
    act(() => {
      updateHandler?.(payload);
    });

    expect(result.current.players).toEqual(updatedPlayers);
  });

  it("should disconnect socket on unmount", () => {
    const { unmount } = renderHook(() => useLeaderboardSocket(gameId, initialPlayers, "LIVE"));

    unmount();

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it("should handle connection errors", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useLeaderboardSocket(gameId, initialPlayers, "LIVE"));

    // Get the connect_error handler
    const errorHandler = mockOn.mock.calls.find((call) => call[0] === "connect_error")?.[1];

    // Trigger error
    act(() => {
      errorHandler?.(new Error("Connection failed"));
    });

    expect(result.current.connectionStatus).toBe("disconnected");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should handle leaderboard errors", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderHook(() => useLeaderboardSocket(gameId, initialPlayers, "LIVE"));

    // Get the error handler
    const errorHandler = mockOn.mock.calls.find(
      (call) => call[0] === LEADERBOARD_EVENTS.ERROR
    )?.[1];

    // Trigger error
    act(() => {
      errorHandler?.({ code: "TEST_ERROR", message: "Test error" });
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error:"),
      "Test error",
      "TEST_ERROR"
    );

    consoleErrorSpy.mockRestore();
  });
});

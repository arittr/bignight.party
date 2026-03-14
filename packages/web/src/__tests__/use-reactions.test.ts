import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock socket.io-client
vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connected: false,
    disconnect: vi.fn(),
  })),
}));

// Mock auth
vi.mock("../auth", () => ({
  useAuth: () => ({
    token: "test-token",
    playerId: "p1",
    name: "Test",
    isAdmin: false,
  }),
}));

describe("useReactions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("module exports useReactions function", async () => {
    const mod = await import("../hooks/use-reactions");
    expect(typeof mod.useReactions).toBe("function");
  });
});

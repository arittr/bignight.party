import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UseLeaderboardSocketReturn } from "@/hooks/game/use-leaderboard-socket";
import type { LeaderboardPlayer } from "@/types/leaderboard";
import { LeaderboardClient } from "../leaderboard-client";

// Mock the useLeaderboardSocket hook
const mockUseLeaderboardSocket =
  vi.fn<(gameId: string, initialData: LeaderboardPlayer[]) => UseLeaderboardSocketReturn>();

vi.mock("@/hooks/game/use-leaderboard-socket", () => ({
  useLeaderboardSocket: (gameId: string, initialData: LeaderboardPlayer[]) =>
    mockUseLeaderboardSocket(gameId, initialData),
}));

describe("LeaderboardClient", () => {
  const gameId = "game-123";
  const gameName = "My Test Game";
  const eventName = "97th Academy Awards";

  const initialPlayers: LeaderboardPlayer[] = [
    {
      correctCount: 6,
      email: "alice@example.com",
      image: null,
      isCurrentUser: false,
      name: "Alice",
      rank: 1,
      totalScore: 120,
      userId: "user-1",
    },
    {
      correctCount: 5,
      email: "bob@example.com",
      image: null,
      isCurrentUser: true,
      name: "Bob",
      rank: 2,
      totalScore: 100,
      userId: "user-2",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock return value
    mockUseLeaderboardSocket.mockReturnValue({
      connectionStatus: "connected",
      players: initialPlayers,
    });
  });

  it("should render game header with correct props", () => {
    render(
      <LeaderboardClient
        eventName={eventName}
        gameId={gameId}
        gameName={gameName}
        initialPlayers={initialPlayers}
      />
    );

    expect(screen.getByText(gameName)).toBeInTheDocument();
    expect(screen.getByText(eventName)).toBeInTheDocument();
  });

  it("should render connection status", () => {
    render(
      <LeaderboardClient
        eventName={eventName}
        gameId={gameId}
        gameName={gameName}
        initialPlayers={initialPlayers}
      />
    );

    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("should render leaderboard list with players", () => {
    render(
      <LeaderboardClient
        eventName={eventName}
        gameId={gameId}
        gameName={gameName}
        initialPlayers={initialPlayers}
      />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("should call useLeaderboardSocket with correct params", () => {
    render(
      <LeaderboardClient
        eventName={eventName}
        gameId={gameId}
        gameName={gameName}
        initialPlayers={initialPlayers}
      />
    );

    expect(mockUseLeaderboardSocket).toHaveBeenCalledWith(gameId, initialPlayers);
  });

  it("should show connecting status when socket is connecting", () => {
    mockUseLeaderboardSocket.mockReturnValue({
      connectionStatus: "connecting",
      players: initialPlayers,
    });

    render(
      <LeaderboardClient
        eventName={eventName}
        gameId={gameId}
        gameName={gameName}
        initialPlayers={initialPlayers}
      />
    );

    expect(screen.getByText("Connecting...")).toBeInTheDocument();
  });

  it("should show disconnected status when socket is disconnected", () => {
    mockUseLeaderboardSocket.mockReturnValue({
      connectionStatus: "disconnected",
      players: initialPlayers,
    });

    render(
      <LeaderboardClient
        eventName={eventName}
        gameId={gameId}
        gameName={gameName}
        initialPlayers={initialPlayers}
      />
    );

    expect(screen.getByText("Disconnected")).toBeInTheDocument();
  });

  it("should update players when WebSocket hook returns new data", () => {
    const updatedPlayers: LeaderboardPlayer[] = [
      {
        correctCount: 7,
        email: "bob@example.com",
        image: null,
        isCurrentUser: true,
        name: "Bob",
        rank: 1,
        totalScore: 150,
        userId: "user-2",
      },
      {
        correctCount: 6,
        email: "alice@example.com",
        image: null,
        isCurrentUser: false,
        name: "Alice",
        rank: 2,
        totalScore: 120,
        userId: "user-1",
      },
    ];

    mockUseLeaderboardSocket.mockReturnValue({
      connectionStatus: "connected",
      players: updatedPlayers,
    });

    render(
      <LeaderboardClient
        eventName={eventName}
        gameId={gameId}
        gameName={gameName}
        initialPlayers={initialPlayers}
      />
    );

    // Bob should now be first
    const names = screen.getAllByText(/Alice|Bob/);
    expect(names[0]).toHaveTextContent("Bob");
    expect(names[1]).toHaveTextContent("Alice");

    // Bob's score should be updated
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("should show empty state when no players", () => {
    mockUseLeaderboardSocket.mockReturnValue({
      connectionStatus: "connected",
      players: [],
    });

    render(
      <LeaderboardClient
        eventName={eventName}
        gameId={gameId}
        gameName={gameName}
        initialPlayers={[]}
      />
    );

    expect(screen.getByText("No Leaderboard Yet")).toBeInTheDocument();
  });

  it("should render with responsive container classes", () => {
    const { container } = render(
      <LeaderboardClient
        eventName={eventName}
        gameId={gameId}
        gameName={gameName}
        initialPlayers={initialPlayers}
      />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("container", "mx-auto", "max-w-4xl");
  });
});

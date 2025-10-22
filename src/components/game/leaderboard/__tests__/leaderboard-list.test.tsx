import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { LeaderboardPlayer } from "@/types/leaderboard";
import { LeaderboardList } from "../leaderboard-list";

describe("LeaderboardList", () => {
  const mockPlayers: LeaderboardPlayer[] = [
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
    {
      correctCount: 4,
      email: "charlie@example.com",
      image: null,
      isCurrentUser: false,
      name: "Charlie",
      rank: 3,
      totalScore: 80,
      userId: "user-3",
    },
  ];

  it("should render all players", () => {
    render(<LeaderboardList players={mockPlayers} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("should render players in order", () => {
    render(<LeaderboardList players={mockPlayers} />);

    const names = screen.getAllByText(/Alice|Bob|Charlie/);
    expect(names[0]).toHaveTextContent("Alice");
    expect(names[1]).toHaveTextContent("Bob");
    expect(names[2]).toHaveTextContent("Charlie");
  });

  it("should render empty state when no players", () => {
    render(<LeaderboardList players={[]} />);

    expect(screen.getByText("No Leaderboard Yet")).toBeInTheDocument();
    expect(
      screen.getByText(/The leaderboard will appear once winners are revealed/)
    ).toBeInTheDocument();
  });

  it("should render trophy emoji in empty state", () => {
    render(<LeaderboardList players={[]} />);

    expect(screen.getByText("🏆")).toBeInTheDocument();
  });

  it("should not render empty state when players exist", () => {
    render(<LeaderboardList players={mockPlayers} />);

    expect(screen.queryByText("No Leaderboard Yet")).not.toBeInTheDocument();
  });

  it("should pass correct player data to PlayerCard", () => {
    render(<LeaderboardList players={mockPlayers} />);

    // Check first player's data is rendered
    expect(screen.getByText("1")).toBeInTheDocument(); // rank
    expect(screen.getByText("Alice")).toBeInTheDocument(); // name
    expect(screen.getByText("120")).toBeInTheDocument(); // score
    expect(screen.getByText("6 correct picks")).toBeInTheDocument(); // correct count
  });

  it("should handle single player", () => {
    const singlePlayer = [mockPlayers[0]];
    render(<LeaderboardList players={singlePlayer} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("should render with large number of players", () => {
    const manyPlayers: LeaderboardPlayer[] = Array.from({ length: 20 }, (_, i) => ({
      correctCount: 5,
      email: `player${i}@example.com`,
      image: null,
      isCurrentUser: i === 10,
      name: `Player ${i + 1}`,
      rank: i + 1,
      totalScore: 100 - i * 5,
      userId: `user-${i}`,
    }));

    render(<LeaderboardList players={manyPlayers} />);

    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("Player 20")).toBeInTheDocument();
  });
});

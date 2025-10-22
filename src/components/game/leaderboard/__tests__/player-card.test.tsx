import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { LeaderboardPlayer } from "@/types/leaderboard";
import { PlayerCard } from "../player-card";

describe("PlayerCard", () => {
  const basePlayer: LeaderboardPlayer = {
    correctCount: 6,
    email: "alice@example.com",
    image: null,
    isCurrentUser: false,
    name: "Alice Smith",
    rank: 1,
    totalScore: 120,
    userId: "user-1",
  };

  it("should render player name", () => {
    render(<PlayerCard index={0} player={basePlayer} />);

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("should render player rank", () => {
    render(<PlayerCard index={0} player={basePlayer} />);

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should render total score", () => {
    render(<PlayerCard index={0} player={basePlayer} />);

    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("should render correct picks count (plural)", () => {
    render(<PlayerCard index={0} player={basePlayer} />);

    expect(screen.getByText("6 correct picks")).toBeInTheDocument();
  });

  it("should render correct picks count (singular)", () => {
    const player = { ...basePlayer, correctCount: 1 };
    render(<PlayerCard index={0} player={player} />);

    expect(screen.getByText("1 correct pick")).toBeInTheDocument();
  });

  it("should highlight current user with border and background", () => {
    const player = { ...basePlayer, isCurrentUser: true };
    const { container } = render(<PlayerCard index={0} player={player} />);

    const card = container.querySelector(".border-primary");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("bg-primary/5");
  });

  it("should show '(You)' indicator for current user", () => {
    const player = { ...basePlayer, isCurrentUser: true };
    render(<PlayerCard index={0} player={player} />);

    expect(screen.getByText("(You)")).toBeInTheDocument();
  });

  it("should not show '(You)' indicator for other users", () => {
    render(<PlayerCard index={0} player={basePlayer} />);

    expect(screen.queryByText("(You)")).not.toBeInTheDocument();
  });

  it("should render player image when provided", () => {
    const player = { ...basePlayer, image: "https://example.com/alice.jpg" };
    render(<PlayerCard index={0} player={player} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/alice.jpg");
    expect(img).toHaveAttribute("alt", "Alice Smith");
  });

  it("should render initials when no image provided", () => {
    render(<PlayerCard index={0} player={basePlayer} />);

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("should style first place rank with yellow color", () => {
    render(<PlayerCard index={0} player={basePlayer} />);

    const rank = screen.getByText("1");
    expect(rank).toHaveClass("text-yellow-500");
  });

  it("should style second place rank with gray color", () => {
    const player = { ...basePlayer, rank: 2 };
    render(<PlayerCard index={1} player={player} />);

    const rank = screen.getByText("2");
    expect(rank).toHaveClass("text-gray-400");
  });

  it("should style third place rank with amber color", () => {
    const player = { ...basePlayer, rank: 3 };
    render(<PlayerCard index={2} player={player} />);

    const rank = screen.getByText("3");
    expect(rank).toHaveClass("text-amber-700");
  });

  it("should style lower ranks with muted color", () => {
    const player = { ...basePlayer, rank: 5 };
    render(<PlayerCard index={4} player={player} />);

    const rank = screen.getByText("5");
    expect(rank).toHaveClass("text-muted-foreground");
  });

  it("should have reserved space for reaction container", () => {
    const { container } = render(<PlayerCard index={0} player={basePlayer} />);

    const reactionContainer = container.querySelector('[data-reaction-container="true"]');
    expect(reactionContainer).toBeInTheDocument();
    expect(reactionContainer).toHaveClass("hidden");
  });

  it("should render with correct score format for large numbers", () => {
    const player = { ...basePlayer, totalScore: 1234 };
    render(<PlayerCard index={0} player={player} />);

    expect(screen.getByText("1234")).toBeInTheDocument();
  });

  it("should render with zero score", () => {
    const player = { ...basePlayer, correctCount: 0, totalScore: 0 };
    render(<PlayerCard index={0} player={player} />);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("0 correct picks")).toBeInTheDocument();
  });
});

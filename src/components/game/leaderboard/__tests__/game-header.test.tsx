import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GameHeader } from "../game-header";

describe("GameHeader", () => {
  const mockConnectionStatus = <div data-testid="connection-status">Connected</div>;

  it("should render game name", () => {
    render(
      <GameHeader
        connectionStatus={mockConnectionStatus}
        eventName="97th Academy Awards"
        gameName="My Test Game"
      />
    );

    expect(screen.getByText("My Test Game")).toBeInTheDocument();
  });

  it("should render event name", () => {
    render(
      <GameHeader
        connectionStatus={mockConnectionStatus}
        eventName="97th Academy Awards"
        gameName="My Test Game"
      />
    );

    expect(screen.getByText("97th Academy Awards")).toBeInTheDocument();
  });

  it("should render connection status", () => {
    render(
      <GameHeader
        connectionStatus={mockConnectionStatus}
        eventName="97th Academy Awards"
        gameName="My Test Game"
      />
    );

    expect(screen.getByTestId("connection-status")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("should render game name with larger text", () => {
    render(
      <GameHeader
        connectionStatus={mockConnectionStatus}
        eventName="97th Academy Awards"
        gameName="My Test Game"
      />
    );

    const gameName = screen.getByText("My Test Game");
    expect(gameName).toHaveClass("text-2xl");
  });

  it("should render event name with muted text", () => {
    render(
      <GameHeader
        connectionStatus={mockConnectionStatus}
        eventName="97th Academy Awards"
        gameName="My Test Game"
      />
    );

    const eventName = screen.getByText("97th Academy Awards");
    expect(eventName).toHaveClass("text-muted-foreground");
  });
});

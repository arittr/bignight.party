import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConnectionStatus } from "../connection-status";

describe("ConnectionStatus", () => {
  it("should render connected status with green badge", () => {
    render(<ConnectionStatus status="connected" />);

    const badge = screen.getByText("Live");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-green-500");
  });

  it("should render connecting status with yellow badge", () => {
    render(<ConnectionStatus status="connecting" />);

    const badge = screen.getByText("Connecting...");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-amber-500");
  });

  it("should render disconnected status with red badge", () => {
    render(<ConnectionStatus status="disconnected" />);

    const badge = screen.getByText("Disconnected");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-destructive");
  });

  it("should show pulsing indicator for connecting status", () => {
    const { container } = render(<ConnectionStatus status="connecting" />);

    const indicator = container.querySelector(".animate-pulse");
    expect(indicator).toBeInTheDocument();
  });

  it("should show static indicator for connected status", () => {
    const { container } = render(<ConnectionStatus status="connected" />);

    const indicator = container.querySelector(".rounded-full");
    expect(indicator).toBeInTheDocument();
    expect(indicator).not.toHaveClass("animate-pulse");
  });
});

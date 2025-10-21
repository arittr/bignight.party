/**
 * ConfirmDeleteButton Component Tests
 *
 * Tests critical admin UI component for delete confirmation.
 * Focus: Confirmation flow and action invocations (not implementation details).
 * Uses mocked delete actions (no real API calls).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDeleteButton } from "../confirm-delete-button";

describe("ConfirmDeleteButton", () => {
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    vi.stubGlobal("confirm", vi.fn());
  });

  it("renders delete button with correct text", () => {
    render(
      <ConfirmDeleteButton
        onDelete={mockOnDelete}
        confirmMessage="Are you sure?"
        buttonText="Delete Game"
      />
    );

    expect(screen.getByRole("button", { name: "Delete Game" })).toBeInTheDocument();
  });

  it("shows confirmation dialog when button is clicked", async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.fn().mockReturnValue(true);
    vi.stubGlobal("confirm", mockConfirm);

    render(
      <ConfirmDeleteButton
        onDelete={mockOnDelete}
        confirmMessage="Are you sure you want to delete this game?"
        buttonText="Delete"
      />
    );

    const button = screen.getByRole("button", { name: "Delete" });
    await user.click(button);

    expect(mockConfirm).toHaveBeenCalledWith("Are you sure you want to delete this game?");
  });

  it("does NOT call onDelete when confirmation is canceled", async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.fn().mockReturnValue(false);
    vi.stubGlobal("confirm", mockConfirm);

    render(
      <ConfirmDeleteButton
        onDelete={mockOnDelete}
        confirmMessage="Are you sure?"
        buttonText="Delete"
      />
    );

    const button = screen.getByRole("button", { name: "Delete" });
    await user.click(button);

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("calls onDelete when confirmation is accepted", async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.fn().mockReturnValue(true);
    vi.stubGlobal("confirm", mockConfirm);
    mockOnDelete.mockResolvedValue(undefined);

    render(
      <ConfirmDeleteButton
        onDelete={mockOnDelete}
        confirmMessage="Are you sure?"
        buttonText="Delete"
      />
    );

    const button = screen.getByRole("button", { name: "Delete" });
    await user.click(button);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });

  it("calls onDelete only once after confirmation", async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.fn().mockReturnValue(true);
    vi.stubGlobal("confirm", mockConfirm);
    mockOnDelete.mockResolvedValue(undefined);

    render(
      <ConfirmDeleteButton
        onDelete={mockOnDelete}
        confirmMessage="Are you sure?"
        buttonText="Delete"
      />
    );

    const button = screen.getByRole("button", { name: "Delete" });
    await user.click(button);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    // Verify it was called exactly once
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it("applies custom className to button", () => {
    render(
      <ConfirmDeleteButton
        onDelete={mockOnDelete}
        confirmMessage="Are you sure?"
        buttonText="Delete"
        className="custom-delete-button"
      />
    );

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveClass("custom-delete-button");
  });

  it("applies default red styling when no className provided", () => {
    render(
      <ConfirmDeleteButton
        onDelete={mockOnDelete}
        confirmMessage="Are you sure?"
        buttonText="Delete"
      />
    );

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("bg-red-600");
    expect(button.className).toContain("hover:bg-red-700");
  });

  it("works with async onDelete function", async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.fn().mockReturnValue(true);
    vi.stubGlobal("confirm", mockConfirm);

    const asyncDelete = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 100);
        })
    );

    render(
      <ConfirmDeleteButton
        onDelete={asyncDelete}
        confirmMessage="Are you sure?"
        buttonText="Delete"
      />
    );

    const button = screen.getByRole("button", { name: "Delete" });
    await user.click(button);

    await waitFor(() => {
      expect(asyncDelete).toHaveBeenCalled();
    });
  });

  it("handles multiple confirmation prompts correctly", async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.stubGlobal("confirm", mockConfirm);
    mockOnDelete.mockResolvedValue(undefined);

    render(
      <ConfirmDeleteButton
        onDelete={mockOnDelete}
        confirmMessage="Are you sure?"
        buttonText="Delete"
      />
    );

    const button = screen.getByRole("button", { name: "Delete" });

    // First click - canceled
    await user.click(button);
    expect(mockOnDelete).not.toHaveBeenCalled();

    // Second click - confirmed
    await user.click(button);
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });
});

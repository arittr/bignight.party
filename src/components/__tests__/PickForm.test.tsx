/**
 * PickForm Component Tests
 *
 * Tests critical UI component for pick submission using @testing-library/react.
 * Focus: User interactions and action invocations (not implementation details).
 * Uses mocked server actions (no real API calls).
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PickForm } from "../PickForm";

// Mock the server action module
vi.mock("@/lib/actions/pick-actions", () => ({
  submitPickAction: vi.fn(),
}));

// Mock next-safe-action/hooks
const mockExecute = vi.fn();
vi.mock("next-safe-action/hooks", () => ({
  useAction: () => ({
    execute: mockExecute,
    isPending: false,
    result: null,
  }),
}));

describe("PickForm", () => {
  const mockNominations = [
    { id: "nom-1", nominationText: "The Shawshank Redemption" },
    { id: "nom-2", nominationText: "The Godfather" },
    { id: "nom-3", nominationText: "The Dark Knight" },
  ];

  const defaultProps = {
    categoryId: "cat-456",
    categoryName: "Best Picture",
    gameId: "game-123",
    nominations: mockNominations,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue({ data: { success: true } });
  });

  it("renders category name", () => {
    render(<PickForm {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "Best Picture" })).toBeInTheDocument();
  });

  it("renders all nominees as radio options", () => {
    render(<PickForm {...defaultProps} />);

    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons).toHaveLength(3);

    expect(screen.getByLabelText(/The Shawshank Redemption/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/The Godfather/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/The Dark Knight/i)).toBeInTheDocument();
  });

  it("allows selecting a nominee", async () => {
    const user = userEvent.setup();
    render(<PickForm {...defaultProps} />);

    const option = screen.getByLabelText(/The Godfather/i);
    await user.click(option);

    expect(option).toBeChecked();
  });

  it("pre-selects initial nomination if provided", () => {
    render(<PickForm {...defaultProps} initialNominationId="nom-2" />);

    const option = screen.getByLabelText(/The Godfather/i) as HTMLInputElement;
    expect(option.checked).toBe(true);
  });

  it("calls submitPickAction with correct data on form submission", async () => {
    const user = userEvent.setup();
    render(<PickForm {...defaultProps} />);

    // Select a nominee
    const option = screen.getByLabelText(/The Dark Knight/i);
    await user.click(option);

    // Submit form
    const submitButton = screen.getByRole("button", { name: /Submit Pick/i });
    await user.click(submitButton);

    expect(mockExecute).toHaveBeenCalledWith({
      categoryId: "cat-456",
      gameId: "game-123",
      nominationId: "nom-3",
    });
  });

  it("disables submit button when no nomination is selected", () => {
    render(<PickForm {...defaultProps} />);

    const submitButton = screen.getByRole("button", { name: /Submit Pick/i });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button after selecting a nomination", async () => {
    const user = userEvent.setup();
    render(<PickForm {...defaultProps} />);

    const submitButton = screen.getByRole("button", { name: /Submit Pick/i });
    expect(submitButton).toBeDisabled();

    const option = screen.getByLabelText(/The Godfather/i);
    await user.click(option);

    expect(submitButton).not.toBeDisabled();
  });

  it("renders submit button with correct label", () => {
    render(<PickForm {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Submit Pick/i })).toBeInTheDocument();
  });

  it("allows changing selection", async () => {
    const user = userEvent.setup();
    render(<PickForm {...defaultProps} />);

    // Select first option
    const firstOption = screen.getByLabelText(/The Shawshank Redemption/i);
    await user.click(firstOption);
    expect(firstOption).toBeChecked();

    // Change to second option
    const secondOption = screen.getByLabelText(/The Godfather/i);
    await user.click(secondOption);
    expect(secondOption).toBeChecked();
    expect(firstOption).not.toBeChecked();
  });

  it("submits the latest selected nomination", async () => {
    const user = userEvent.setup();
    render(<PickForm {...defaultProps} />);

    // Select first option
    await user.click(screen.getByLabelText(/The Shawshank Redemption/i));

    // Change to different option
    await user.click(screen.getByLabelText(/The Dark Knight/i));

    // Submit form
    const submitButton = screen.getByRole("button", { name: /Submit Pick/i });
    await user.click(submitButton);

    // Should submit the latest selection
    expect(mockExecute).toHaveBeenCalledWith({
      categoryId: "cat-456",
      gameId: "game-123",
      nominationId: "nom-3",
    });
  });
});

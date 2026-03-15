import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { PicksPage } from "../pages/picks";
import type { SaveStatus } from "../components/save-indicator";

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock socket.io-client (required by use-game-state)
vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connected: false,
    disconnect: vi.fn(),
  })),
}));

// Auth mock
const mockUseAuth = vi.fn();
vi.mock("../auth", () => ({ useAuth: () => mockUseAuth() }));

// Game state mock
const mockUseGameState = vi.fn();
vi.mock("../hooks/use-game-state", () => ({
  useGameState: () => mockUseGameState(),
}));

// Picks mock
const mockSetSelectedNominationId = vi.fn();
const mockHandleSelect = vi.fn();
const mockUsePicks = vi.fn();
vi.mock("../hooks/use-picks", () => ({ usePicks: () => mockUsePicks() }));

const CATEGORIES = [
  {
    id: "cat-1",
    name: "Best Picture",
    nominations: [
      { id: "nom-1", title: "Oppenheimer", subtitle: "Christopher Nolan", imageUrl: null },
      { id: "nom-2", title: "Barbie", subtitle: "Greta Gerwig", imageUrl: null },
    ],
  },
  {
    id: "cat-2",
    name: "Best Director",
    nominations: [
      { id: "nom-3", title: "Christopher Nolan", subtitle: "Oppenheimer", imageUrl: null },
    ],
  },
];

function makeQueryClient() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(["categories"], CATEGORIES);
  return qc;
}

function renderPicksPage(qc = makeQueryClient()) {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <PicksPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PicksPage", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      token: "test-token",
      playerId: "p1",
      name: "Test Player",
      isAdmin: false,
    });
    mockUseGameState.mockReturnValue({
      phase: "open",
      config: null,
      categoryCount: 2,
      isLoading: false,
          });
    mockUsePicks.mockReturnValue({
      picks: [],
      selectedNominationId: null,
      setSelectedNominationId: mockSetSelectedNominationId,
      handleSelect: mockHandleSelect,
      saveStatus: "idle" as SaveStatus,
      isLoading: false,
      completedCategoryIds: new Set<string>(),
      isSubmitting: false,
    });
  });

  it("redirects to / when not authenticated", async () => {
    mockUseAuth.mockReturnValue({ token: null, playerId: null, name: null, isAdmin: false });
    renderPicksPage();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
  });

  it("redirects to /leaderboard when phase is locked", async () => {
    mockUseGameState.mockReturnValue({ phase: "locked", config: null, categoryCount: 2, isLoading: false, lockWarning: false });
    renderPicksPage();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/leaderboard"));
  });

  it("redirects to /leaderboard when phase is completed", async () => {
    mockUseGameState.mockReturnValue({ phase: "completed", config: null, categoryCount: 2, isLoading: false, lockWarning: false });
    renderPicksPage();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/leaderboard"));
  });

  it("renders category pills for all categories", () => {
    renderPicksPage();
    // CategoryPills strips "Best " prefix
    expect(screen.getByText("Picture")).toBeInTheDocument();
    expect(screen.getByText("Director")).toBeInTheDocument();
  });

  it("renders nominations for the first category by default", () => {
    renderPicksPage();
    expect(screen.getByText("Oppenheimer")).toBeInTheDocument();
    expect(screen.getByText("Barbie")).toBeInTheDocument();
  });

  it("shows the current category title", () => {
    renderPicksPage();
    expect(screen.getByRole("heading", { name: "Best Picture" })).toBeInTheDocument();
  });

  it("shows progress counter", () => {
    renderPicksPage();
    expect(screen.getByText("0 of 2 picked")).toBeInTheDocument();
  });

  it("shows progress counter with completed picks", () => {
    mockUsePicks.mockReturnValue({
      picks: [{ categoryId: "cat-1", nominationId: "nom-1" }],
      selectedNominationId: "nom-1",
      setSelectedNominationId: mockSetSelectedNominationId,
      handleSelect: mockHandleSelect,
      saveStatus: "idle" as SaveStatus,
      isLoading: false,
      completedCategoryIds: new Set(["cat-1"]),
      isSubmitting: false,
    });
    renderPicksPage();
    expect(screen.getByText("1 of 2 picked")).toBeInTheDocument();
  });

  it("calls handleSelect when a nomination card is clicked", () => {
    renderPicksPage();
    fireEvent.click(screen.getByText("Oppenheimer").closest("button")!);
    expect(mockHandleSelect).toHaveBeenCalledWith("cat-1", "nom-1");
  });

  it("shows next category when Next button is clicked", () => {
    renderPicksPage();
    fireEvent.click(screen.getByText(/Next/));
    expect(screen.getByRole("heading", { name: "Best Director" })).toBeInTheDocument();
    expect(screen.getByText("Christopher Nolan")).toBeInTheDocument();
  });

  it("shows previous category when Previous button is clicked", () => {
    renderPicksPage();
    fireEvent.click(screen.getByText(/Next/));
    fireEvent.click(screen.getByText(/Previous/));
    expect(screen.getByRole("heading", { name: "Best Picture" })).toBeInTheDocument();
  });

  it("disables Previous button on first category", () => {
    renderPicksPage();
    expect(screen.getByRole("button", { name: /Previous/ })).toBeDisabled();
  });

  it("disables Next button on last category", () => {
    renderPicksPage();
    fireEvent.click(screen.getByText(/Next/));
    expect(screen.getByRole("button", { name: /Next/ })).toBeDisabled();
  });

  it("navigates to category when pill is clicked", () => {
    renderPicksPage();
    fireEvent.click(screen.getByText("Director"));
    expect(screen.getByRole("heading", { name: "Best Director" })).toBeInTheDocument();
  });

});

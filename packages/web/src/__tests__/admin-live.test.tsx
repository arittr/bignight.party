import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { AdminLivePage } from "../pages/admin-live";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("../auth", () => ({
  useAuth: () => mockUseAuth(),
}));

const adminAuth = { token: "admin-token", isAdmin: true };
const nonAdminAuth = { token: "user-token", isAdmin: false };

const mockCategories = [
  {
    id: "cat-1",
    name: "Best Picture",
    order: 1,
    points: 1,
    winnerId: null,
    isRevealed: false,
    createdAt: 0,
    nominations: [
      { id: "nom-1", categoryId: "cat-1", title: "Oppenheimer", subtitle: "Christopher Nolan", imageUrl: null, createdAt: 0 },
      { id: "nom-2", categoryId: "cat-1", title: "Barbie", subtitle: "Greta Gerwig", imageUrl: null, createdAt: 0 },
    ],
  },
  {
    id: "cat-2",
    name: "Best Director",
    order: 2,
    points: 1,
    winnerId: "nom-3",
    isRevealed: true,
    createdAt: 0,
    nominations: [
      { id: "nom-3", categoryId: "cat-2", title: "Christopher Nolan", subtitle: "Oppenheimer", imageUrl: null, createdAt: 0 },
      { id: "nom-4", categoryId: "cat-2", title: "Greta Gerwig", subtitle: "Barbie", imageUrl: null, createdAt: 0 },
    ],
  },
];

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/admin/live"]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function setupFetchMock(categories = mockCategories) {
  global.fetch = vi.fn((url: string) => {
    if (url === "/api/categories") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(categories) } as Response);
    }
    if (url === "/api/admin/mark-winner") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
    }
    if (url === "/api/admin/clear-winner") {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue(adminAuth);
});

afterEach(() => {
  cleanup();
});

describe("AdminLivePage", () => {
  describe("admin guard", () => {
    it("redirects to /admin when not admin", () => {
      mockUseAuth.mockReturnValue(nonAdminAuth);
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      expect(mockNavigate).toHaveBeenCalledWith("/admin");
    });

    it("does not redirect when admin", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      expect(mockNavigate).not.toHaveBeenCalledWith("/admin");
    });
  });

  describe("loading state", () => {
    it("shows loading when no categories yet", () => {
      global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      const loadingEls = screen.getAllByText(/loading/i);
      expect(loadingEls.length).toBeGreaterThan(0);
    });
  });

  describe("header", () => {
    it("shows Live heading", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getAllByText("Live"));
      const headings = screen.getAllByRole("heading", { name: "Live" });
      expect(headings.length).toBeGreaterThan(0);
    });

    it("shows revealed count out of total", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getByText(/1 \/ 2 revealed/));
      expect(screen.getByText("1 / 2 revealed")).toBeInTheDocument();
    });
  });

  describe("category pills", () => {
    it("renders a pill for each category", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getByText("Picture"));
      expect(screen.getByText("Picture")).toBeInTheDocument();
      expect(screen.getByText("Director")).toBeInTheDocument();
    });

    it("switching pill changes displayed category", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getByText("Director"));
      fireEvent.click(screen.getByText("Director"));
      expect(screen.getByRole("heading", { name: "Best Director" })).toBeInTheDocument();
    });
  });

  describe("nomination cards", () => {
    it("renders nominations for the selected category", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getByText("Oppenheimer"));
      expect(screen.getByText("Oppenheimer")).toBeInTheDocument();
      expect(screen.getByText("Barbie")).toBeInTheDocument();
    });
  });

  describe("mark winner flow", () => {
    it("shows confirmation when tapping a nomination on unrevealed category", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getByText("Oppenheimer"));
      fireEvent.click(screen.getByText("Oppenheimer").closest("button")!);
      // Confirmation renders the title in a nested span; verify both parts are present
      expect(await screen.findByText("Confirm")).toBeInTheDocument();
      expect(screen.getByText("Oppenheimer", { selector: "span.font-bold" })).toBeInTheDocument();
    });

    it("calls POST /api/admin/mark-winner on Confirm", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getByText("Oppenheimer"));
      fireEvent.click(screen.getByText("Oppenheimer").closest("button")!);
      await screen.findByText("Confirm");
      fireEvent.click(screen.getByText("Confirm"));
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/admin/mark-winner",
          expect.objectContaining({ method: "POST" })
        );
      });
    });

    it("dismisses confirmation on Cancel", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getByText("Oppenheimer"));
      fireEvent.click(screen.getByText("Oppenheimer").closest("button")!);
      await screen.findByText("Cancel");
      fireEvent.click(screen.getByText("Cancel"));
      expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
    });

    it("does not show confirmation for revealed category nominations", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getByText("Director"));
      fireEvent.click(screen.getByText("Director"));
      await waitFor(() => screen.getByText("Christopher Nolan"));
      fireEvent.click(screen.getByText("Christopher Nolan").closest("button")!);
      expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
    });
  });

  describe("undo winner", () => {
    it("shows Undo button only for revealed categories", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      // First category (unrevealed) — no undo
      await waitFor(() => screen.getByText("Oppenheimer"));
      expect(screen.queryByText(/undo winner/i)).not.toBeInTheDocument();
      // Switch to revealed category
      fireEvent.click(screen.getByText("Director"));
      await waitFor(() => screen.getByText(/undo winner/i));
      expect(screen.getByText(/undo winner/i)).toBeInTheDocument();
    });

    it("calls POST /api/admin/clear-winner on Undo", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getByText("Director"));
      fireEvent.click(screen.getByText("Director"));
      await waitFor(() => screen.getByText(/undo winner/i));
      fireEvent.click(screen.getByText(/undo winner/i));
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/admin/clear-winner",
          expect.objectContaining({ method: "POST" })
        );
      });
    });
  });

  describe("prev/next navigation", () => {
    it("Previous button is disabled on first category", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getByText("← Previous"));
      expect(screen.getByText("← Previous").closest("button")).toBeDisabled();
    });

    it("Next button is disabled on last category", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getByText("Next →"));
      fireEvent.click(screen.getByText("Next →"));
      await waitFor(() => screen.getByRole("heading", { name: "Best Director" }));
      expect(screen.getByText("Next →").closest("button")).toBeDisabled();
    });

    it("Next button advances to next category", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getByText("Next →"));
      fireEvent.click(screen.getByText("Next →"));
      await waitFor(() => screen.getByRole("heading", { name: "Best Director" }));
      expect(screen.getByRole("heading", { name: "Best Director" })).toBeInTheDocument();
    });

    it("Previous button goes back to previous category", async () => {
      setupFetchMock();
      render(<AdminLivePage />, { wrapper: makeWrapper() });
      await waitFor(() => screen.getByText("Next →"));
      fireEvent.click(screen.getByText("Next →"));
      await waitFor(() => screen.getByRole("heading", { name: "Best Director" }));
      fireEvent.click(screen.getByText("← Previous"));
      await waitFor(() => screen.getByRole("heading", { name: "Best Picture" }));
      expect(screen.getByRole("heading", { name: "Best Picture" })).toBeInTheDocument();
    });
  });
});

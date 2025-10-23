import { render, screen } from "@testing-library/react";
import { Calendar } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { ResourcePageLayout } from "./resource-page-layout";

describe("ResourcePageLayout", () => {
  const mockHeader = {
    breadcrumbs: [{ href: "/admin", label: "Admin" }, { label: "Resources" }],
    description: "Manage test resources",
    title: "Test Resources",
  };

  const mockEmptyState = {
    icon: <Calendar className="h-12 w-12" />,
    message: "Create your first resource to get started",
    primaryAction: {
      label: "Create Resource",
      onClick: vi.fn(),
    },
    title: "No resources yet",
  };

  describe("Header Rendering", () => {
    it("renders page header with title and description", () => {
      render(
        <ResourcePageLayout header={mockHeader}>
          <div>Content</div>
        </ResourcePageLayout>
      );

      expect(screen.getByText("Test Resources")).toBeInTheDocument();
      expect(screen.getByText("Manage test resources")).toBeInTheDocument();
    });

    it("renders breadcrumbs", () => {
      render(
        <ResourcePageLayout header={mockHeader}>
          <div>Content</div>
        </ResourcePageLayout>
      );

      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.getByText("Resources")).toBeInTheDocument();
    });

    it("renders header actions when provided", () => {
      const headerWithActions = {
        ...mockHeader,
        actions: <button type="button">Action Button</button>,
      };

      render(
        <ResourcePageLayout header={headerWithActions}>
          <div>Content</div>
        </ResourcePageLayout>
      );

      expect(screen.getByText("Action Button")).toBeInTheDocument();
    });
  });

  describe("Content Rendering", () => {
    it("renders children when showEmptyState is false", () => {
      render(
        <ResourcePageLayout header={mockHeader} showEmptyState={false}>
          <div data-testid="content">Main Content</div>
        </ResourcePageLayout>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByText("Main Content")).toBeInTheDocument();
    });

    it("renders children when emptyState is not provided", () => {
      render(
        <ResourcePageLayout header={mockHeader}>
          <div data-testid="content">Main Content</div>
        </ResourcePageLayout>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("wraps children in space-y-4 container", () => {
      render(
        <ResourcePageLayout header={mockHeader}>
          <div data-testid="content">Content</div>
        </ResourcePageLayout>
      );

      const container = screen.getByTestId("content").parentElement;
      expect(container).toHaveClass("space-y-4");
    });
  });

  describe("Empty State", () => {
    it("shows empty state when showEmptyState is true and emptyState provided", () => {
      render(
        <ResourcePageLayout emptyState={mockEmptyState} header={mockHeader} showEmptyState={true}>
          <div>Content that should not appear</div>
        </ResourcePageLayout>
      );

      expect(screen.getByText("No resources yet")).toBeInTheDocument();
      expect(screen.getByText("Create your first resource to get started")).toBeInTheDocument();
      expect(screen.getByText("Create Resource")).toBeInTheDocument();
      expect(screen.queryByText("Content that should not appear")).not.toBeInTheDocument();
    });

    it("shows children when showEmptyState is false even if emptyState provided", () => {
      render(
        <ResourcePageLayout emptyState={mockEmptyState} header={mockHeader} showEmptyState={false}>
          <div data-testid="content">Main Content</div>
        </ResourcePageLayout>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.queryByText("No resources yet")).not.toBeInTheDocument();
    });

    it("shows children when showEmptyState is true but emptyState not provided", () => {
      render(
        <ResourcePageLayout header={mockHeader} showEmptyState={true}>
          <div data-testid="content">Main Content</div>
        </ResourcePageLayout>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("renders empty state icon", () => {
      render(
        <ResourcePageLayout emptyState={mockEmptyState} header={mockHeader} showEmptyState={true}>
          <div>Content</div>
        </ResourcePageLayout>
      );

      // Icon should be rendered (aria-hidden div)
      const iconContainer = screen.getByText("No resources yet").parentElement;
      expect(iconContainer?.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it("renders empty state primary action button", () => {
      render(
        <ResourcePageLayout emptyState={mockEmptyState} header={mockHeader} showEmptyState={true}>
          <div>Content</div>
        </ResourcePageLayout>
      );

      const button = screen.getByText("Create Resource");
      expect(button).toBeInTheDocument();
    });

    it("renders empty state without actions", () => {
      const emptyStateWithoutActions = {
        icon: <Calendar className="h-12 w-12" />,
        message: "Resources will appear here",
        title: "No resources yet",
      };

      render(
        <ResourcePageLayout
          emptyState={emptyStateWithoutActions}
          header={mockHeader}
          showEmptyState={true}
        >
          <div>Content</div>
        </ResourcePageLayout>
      );

      expect(screen.getByText("No resources yet")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("Layout Structure", () => {
    it("applies custom className to root container", () => {
      const { container } = render(
        <ResourcePageLayout className="custom-class" header={mockHeader}>
          <div>Content</div>
        </ResourcePageLayout>
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("renders header before content", () => {
      const { container } = render(
        <ResourcePageLayout header={mockHeader}>
          <div data-testid="content">Content</div>
        </ResourcePageLayout>
      );

      const header = screen.getByText("Test Resources");
      const content = screen.getByTestId("content");

      // Header should come before content in DOM order
      expect(
        container.firstChild?.contains(header) &&
          container.firstChild?.contains(content) &&
          header.compareDocumentPosition(content) === Node.DOCUMENT_POSITION_FOLLOWING
      ).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("renders with minimal props", () => {
      render(
        <ResourcePageLayout header={{ title: "Minimal" }}>
          <div>Content</div>
        </ResourcePageLayout>
      );

      expect(screen.getByText("Minimal")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("handles empty breadcrumbs array", () => {
      const headerWithEmptyBreadcrumbs = {
        ...mockHeader,
        breadcrumbs: [],
      };

      render(
        <ResourcePageLayout header={headerWithEmptyBreadcrumbs}>
          <div>Content</div>
        </ResourcePageLayout>
      );

      expect(screen.getByText("Test Resources")).toBeInTheDocument();
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });

    it("handles undefined description", () => {
      const headerWithoutDescription = {
        breadcrumbs: [],
        title: "Test",
      };

      render(
        <ResourcePageLayout header={headerWithoutDescription}>
          <div>Content</div>
        </ResourcePageLayout>
      );

      expect(screen.getByText("Test")).toBeInTheDocument();
    });
  });
});

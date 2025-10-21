/**
 * NomineeCard Component Tests
 *
 * Tests image priority fallback logic:
 * Priority: person.imageUrl → work.imageUrl → placeholder
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NomineeCard } from "../nominee-card";

describe("NomineeCard", () => {
  const mockOnClick = vi.fn();

  describe("image priority fallback", () => {
    it("prioritizes person.imageUrl over work.imageUrl when both exist", () => {
      const nomination = {
        id: "nom-1",
        nominationText: "Cillian Murphy for Oppenheimer",
        person: {
          imageUrl: "https://example.com/cillian.jpg",
          name: "Cillian Murphy",
        },
        work: {
          imageUrl: "https://example.com/oppenheimer-poster.jpg",
          title: "Oppenheimer",
          year: 2023,
        },
      };

      render(
        <NomineeCard
          isLocked={false}
          isSelected={false}
          nomination={nomination}
          onClick={mockOnClick}
        />
      );

      const img = screen.getByRole("img");
      // Should use person image, NOT work poster
      expect(img).toHaveAttribute("src", "https://example.com/cillian.jpg");
      expect(img).toHaveAttribute("alt", "Cillian Murphy");
    });

    it("falls back to work.imageUrl when person.imageUrl is null", () => {
      const nomination = {
        id: "nom-2",
        nominationText: "Oppenheimer",
        person: null,
        work: {
          imageUrl: "https://example.com/oppenheimer-poster.jpg",
          title: "Oppenheimer",
          year: 2023,
        },
      };

      render(
        <NomineeCard
          isLocked={false}
          isSelected={false}
          nomination={nomination}
          onClick={mockOnClick}
        />
      );

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", "https://example.com/oppenheimer-poster.jpg");
      expect(img).toHaveAttribute("alt", "Oppenheimer");
    });

    it("falls back to work.imageUrl when person exists but imageUrl is null", () => {
      const nomination = {
        id: "nom-3",
        nominationText: "Cillian Murphy for Oppenheimer",
        person: {
          imageUrl: null,
          name: "Cillian Murphy",
        },
        work: {
          imageUrl: "https://example.com/oppenheimer-poster.jpg",
          title: "Oppenheimer",
          year: 2023,
        },
      };

      render(
        <NomineeCard
          isLocked={false}
          isSelected={false}
          nomination={nomination}
          onClick={mockOnClick}
        />
      );

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", "https://example.com/oppenheimer-poster.jpg");
    });

    it("shows placeholder when both person.imageUrl and work.imageUrl are null", () => {
      const nomination = {
        id: "nom-4",
        nominationText: "Unknown Nominee",
        person: {
          imageUrl: null,
          name: "Unknown",
        },
        work: null,
      };

      render(
        <NomineeCard
          isLocked={false}
          isSelected={false}
          nomination={nomination}
          onClick={mockOnClick}
        />
      );

      // Should show placeholder (no img element, just SVG)
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.getByRole("button")).toContainHTML("svg");
    });
  });
});

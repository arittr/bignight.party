/**
 * NomineeCard Component Tests
 *
 * Tests image priority fallback logic:
 * Priority: person.imageUrl → work.imageUrl → placeholder
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NomineeCard } from "../nominee-card";

describe("NomineeCard", () => {
  const mockOnClick = vi.fn();

  describe("image priority fallback", () => {
    it("prioritizes person.imageUrl over work.imageUrl when both exist", () => {
      const nomination = {
        id: "nom-1",
        nominationText: "Cillian Murphy for Oppenheimer",
        person: {
          name: "Cillian Murphy",
          imageUrl: "https://example.com/cillian.jpg",
        },
        work: {
          title: "Oppenheimer",
          imageUrl: "https://example.com/oppenheimer-poster.jpg",
          year: 2023,
        },
      };

      render(
        <NomineeCard
          nomination={nomination}
          isSelected={false}
          isLocked={false}
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
          title: "Oppenheimer",
          imageUrl: "https://example.com/oppenheimer-poster.jpg",
          year: 2023,
        },
      };

      render(
        <NomineeCard
          nomination={nomination}
          isSelected={false}
          isLocked={false}
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
          name: "Cillian Murphy",
          imageUrl: null,
        },
        work: {
          title: "Oppenheimer",
          imageUrl: "https://example.com/oppenheimer-poster.jpg",
          year: 2023,
        },
      };

      render(
        <NomineeCard
          nomination={nomination}
          isSelected={false}
          isLocked={false}
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
          name: "Unknown",
          imageUrl: null,
        },
        work: null,
      };

      render(
        <NomineeCard
          nomination={nomination}
          isSelected={false}
          isLocked={false}
          onClick={mockOnClick}
        />
      );

      // Should show placeholder (no img element, just SVG)
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.getByRole("button")).toContainHTML("svg");
    });
  });
});

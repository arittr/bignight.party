import { describe, expect, it } from "vitest";
import { getCategoryPoints, CATEGORY_POINTS } from "../constants";

describe("getCategoryPoints", () => {
  it("returns 5 for Best Picture", () => {
    expect(getCategoryPoints("Best Picture")).toBe(5);
  });

  it("returns 4 for Best Director", () => {
    expect(getCategoryPoints("Best Director")).toBe(4);
  });

  it("returns 3 for lead acting categories", () => {
    expect(getCategoryPoints("Best Actor")).toBe(3);
    expect(getCategoryPoints("Best Actress")).toBe(3);
  });

  it("returns 2 for supporting acting categories", () => {
    expect(getCategoryPoints("Best Supporting Actor")).toBe(2);
    expect(getCategoryPoints("Best Supporting Actress")).toBe(2);
  });

  it("returns 2 for screenplay categories", () => {
    expect(getCategoryPoints("Best Original Screenplay")).toBe(2);
    expect(getCategoryPoints("Best Adapted Screenplay")).toBe(2);
  });

  it("returns 1 for technical/craft categories", () => {
    expect(getCategoryPoints("Best Cinematography")).toBe(1);
    expect(getCategoryPoints("Best Film Editing")).toBe(1);
    expect(getCategoryPoints("Best Visual Effects")).toBe(1);
    expect(getCategoryPoints("Best Sound")).toBe(1);
    expect(getCategoryPoints("Best Costume Design")).toBe(1);
  });

  it("returns 1 for unknown categories", () => {
    expect(getCategoryPoints("Best Something New")).toBe(1);
    expect(getCategoryPoints("")).toBe(1);
  });

  it("is case-insensitive", () => {
    expect(getCategoryPoints("best picture")).toBe(5);
    expect(getCategoryPoints("BEST DIRECTOR")).toBe(4);
  });
});

describe("CATEGORY_POINTS", () => {
  it("has entries for all major Oscar categories", () => {
    const names = Object.keys(CATEGORY_POINTS);
    expect(names.length).toBeGreaterThanOrEqual(8);
  });

  it("all point values are positive integers", () => {
    for (const [name, points] of Object.entries(CATEGORY_POINTS)) {
      expect(points, `${name} should have positive integer points`).toBeGreaterThan(0);
      expect(Number.isInteger(points), `${name} points should be integer`).toBe(true);
    }
  });
});

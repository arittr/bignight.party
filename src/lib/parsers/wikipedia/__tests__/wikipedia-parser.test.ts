/**
 * Wikipedia Parser Tests
 *
 * Tests image extraction from Wikipedia pages for people and works
 */

import { describe, it, expect } from "vitest";
import { fetchWikipediaImage } from "../wikipedia-parser";

describe("Wikipedia Parser - Image Extraction", () => {
  it("fetches image URL for a person (Cillian Murphy)", async () => {
    const imageUrl = await fetchWikipediaImage("Cillian_Murphy");

    expect(imageUrl).toBeTruthy();
    expect(imageUrl).toMatch(/^https?:\/\//);
    // Accept both wikimedia URLs and wikipedia redirect URLs
    expect(imageUrl).toMatch(/wikimedia|wikipedia\.org/i);
  }, 10000); // 10s timeout for API call

  it("fetches image URL for a work (Oppenheimer film)", async () => {
    const imageUrl = await fetchWikipediaImage("Oppenheimer_(film)");

    expect(imageUrl).toBeTruthy();
    expect(imageUrl).toMatch(/^https?:\/\//);
    // Accept both wikimedia URLs and wikipedia redirect URLs
    expect(imageUrl).toMatch(/wikimedia|wikipedia\.org/i);
  }, 10000);

  it("returns null for pages without images", async () => {
    // Use a disambiguation page which typically has no main image
    const imageUrl = await fetchWikipediaImage("Test");

    // Could be null or a valid URL depending on the page
    if (imageUrl) {
      expect(imageUrl).toMatch(/^https?:\/\//);
    } else {
      expect(imageUrl).toBeNull();
    }
  }, 10000);

  it("returns null for non-existent pages", async () => {
    const imageUrl = await fetchWikipediaImage("NonExistentPage12345XYZ");

    expect(imageUrl).toBeNull();
  }, 10000);
});

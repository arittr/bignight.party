import { describe, expect, it } from "vitest";
import { parseWikipediaUrl } from "../wikipedia";

describe("parseWikipediaUrl", () => {
	it("parses 97th Academy Awards page", async () => {
		const result = await parseWikipediaUrl("https://en.wikipedia.org/wiki/97th_Academy_Awards");
		expect(result.name).toContain("97th");
		expect(result.categories.length).toBeGreaterThan(20);

		const bestPicture = result.categories.find((c) =>
			c.name.toLowerCase().includes("best picture"),
		);
		expect(bestPicture).toBeDefined();
		expect(bestPicture?.nominations.length).toBeGreaterThanOrEqual(5);

		for (const nom of bestPicture?.nominations ?? []) {
			expect(nom.title.length).toBeGreaterThan(0);
		}
	}, 30000);

	it("rejects non-Wikipedia URLs", async () => {
		await expect(parseWikipediaUrl("https://example.com/not-wikipedia")).rejects.toThrow();
	});

	it("rejects invalid Wikipedia pages", async () => {
		await expect(
			parseWikipediaUrl("https://en.wikipedia.org/wiki/Nonexistent_Page_12345xyz"),
		).rejects.toThrow();
	});
});

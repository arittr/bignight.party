/**
 * Wikipedia Parser — extracts Academy Awards ceremony data from Wikipedia pages.
 *
 * Parses category names and nominations from Wikipedia markup using wtf_wikipedia.
 * Handles three table formats:
 *   1. Standard table (one category per table)
 *   2. Compact two-per-row table (used in recent ceremonies like the 97th)
 *   3. Bullet-point nominations within table cells
 *
 * Database-agnostic: takes a URL, returns structured data.
 */

import wtf, { type Document } from "wtf_wikipedia";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedNomination {
	title: string;
	subtitle: string;
	imageUrl: string | null;
}

export interface ParsedCategory {
	name: string;
	nominations: ParsedNomination[];
}

export interface ParsedCeremony {
	name: string;
	categories: ParsedCategory[];
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class WikipediaParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "WikipediaParseError";
	}
}

export class WikipediaAPIError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "WikipediaAPIError";
	}
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a Wikipedia Academy Awards page and returns structured ceremony data.
 *
 * @param url - Full Wikipedia URL (e.g. "https://en.wikipedia.org/wiki/97th_Academy_Awards")
 * @throws WikipediaParseError for invalid URLs or pages with no award categories
 * @throws WikipediaAPIError if the Wikipedia fetch fails
 */
export async function parseWikipediaUrl(url: string): Promise<ParsedCeremony> {
	const pageTitle = extractPageTitle(url);

	const doc = await fetchDocument(pageTitle);
	const ceremonyName = doc.title() || pageTitle.replace(/_/g, " ");
	const categories = extractCategories(doc);

	if (categories.length === 0) {
		throw new WikipediaParseError(
			"No award categories found. This may not be a valid awards ceremony Wikipedia page.",
		);
	}

	return { name: ceremonyName, categories };
}

/**
 * Fetches the main image URL for a Wikipedia page by slug.
 *
 * Useful for enriching nominations with poster/headshot images.
 * Returns null on any failure (missing page, no images, network error).
 */
export async function fetchWikipediaImage(wikipediaSlug: string): Promise<string | null> {
	try {
		const fetchResult = await wtf.fetch(wikipediaSlug);
		if (!fetchResult) return null;

		const doc = Array.isArray(fetchResult) ? fetchResult[0] : fetchResult;
		if (!doc) return null;

		const images = doc.images();
		if (!images || images.length === 0) return null;

		const mainImage = images[0];
		return mainImage?.url() || null;
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// URL validation
// ---------------------------------------------------------------------------

function extractPageTitle(url: string): string {
	let urlObj: URL;
	try {
		urlObj = new URL(url);
	} catch {
		throw new WikipediaParseError(
			"Invalid Wikipedia URL. Must be a valid Wikipedia article URL " +
				"(e.g., https://en.wikipedia.org/wiki/97th_Academy_Awards)",
		);
	}

	if (!urlObj.hostname.includes("wikipedia.org")) {
		throw new WikipediaParseError(
			"Invalid Wikipedia URL. Must be a valid Wikipedia article URL " +
				"(e.g., https://en.wikipedia.org/wiki/97th_Academy_Awards)",
		);
	}

	if (!urlObj.pathname.includes("/wiki/")) {
		throw new WikipediaParseError(
			"Invalid Wikipedia URL. Must be a valid Wikipedia article URL " +
				"(e.g., https://en.wikipedia.org/wiki/97th_Academy_Awards)",
		);
	}

	const pathParts = urlObj.pathname.split("/wiki/");
	const rawTitle = pathParts[1];
	if (!rawTitle) {
		throw new WikipediaParseError(
			"Invalid Wikipedia URL. Must be a valid Wikipedia article URL " +
				"(e.g., https://en.wikipedia.org/wiki/97th_Academy_Awards)",
		);
	}

	return decodeURIComponent(rawTitle);
}

// ---------------------------------------------------------------------------
// Wikipedia fetch
// ---------------------------------------------------------------------------

async function fetchDocument(pageTitle: string): Promise<Document> {
	const fetchResult = await wtf.fetch(pageTitle);
	if (!fetchResult) {
		throw new WikipediaAPIError(`Failed to fetch Wikipedia page: ${pageTitle}`);
	}

	const doc = Array.isArray(fetchResult) ? fetchResult[0] : fetchResult;
	if (!doc) {
		throw new WikipediaAPIError(`Failed to fetch Wikipedia page: ${pageTitle}`);
	}

	return doc;
}

// ---------------------------------------------------------------------------
// Category / nomination extraction
// ---------------------------------------------------------------------------

const SKIP_SECTIONS = ["reference", "external", "see also", "notes"];

function shouldSkipSection(title: string): boolean {
	const lower = title.toLowerCase();
	return SKIP_SECTIONS.some((s) => lower.includes(s));
}

/**
 * Attempts to parse a table as either compact or standard format.
 */
function parseCategoriesFromTable(
	sectionTitle: string,
	table: { json(): unknown },
): ParsedCategory[] {
	try {
		// Try compact two-per-row format first (returns multiple categories)
		const compactCategories = parseCompactAwardsTable(table);
		if (compactCategories && compactCategories.length > 0) {
			return compactCategories;
		}

		// Fall back to standard single-category table
		const category = parseCategoryFromTable(sectionTitle, table);
		return category ? [category] : [];
	} catch {
		// Skip tables that fail to parse
		return [];
	}
}

/**
 * Normalizes wtf_wikipedia's tables() return to always be an array.
 */
function getSectionTables(section: { tables(): unknown }): Array<{ json(): unknown }> {
	const tablesResult = section.tables();
	if (Array.isArray(tablesResult)) return tablesResult;
	return tablesResult ? [tablesResult as { json(): unknown }] : [];
}

/**
 * Walks every section of the document and extracts categories from tables.
 */
function extractCategories(doc: Document): ParsedCategory[] {
	const categories: ParsedCategory[] = [];

	const sectionsResult = doc.sections();
	const sections = Array.isArray(sectionsResult) ? sectionsResult : [sectionsResult];

	for (const section of sections) {
		const sectionTitle = section.title();
		if (!sectionTitle || shouldSkipSection(sectionTitle)) continue;

		for (const table of getSectionTables(section)) {
			categories.push(...parseCategoriesFromTable(sectionTitle, table));
		}
	}

	return categories;
}

// ---------------------------------------------------------------------------
// Standard table parsing (one category per table)
// ---------------------------------------------------------------------------

function parseCategoryFromTable(
	sectionTitle: string,
	table: { json(): unknown },
): ParsedCategory | null {
	const jsonResult = table.json();
	if (!jsonResult || typeof jsonResult !== "object") return null;

	const rows = Array.isArray(jsonResult) ? jsonResult : [];
	if (rows.length === 0) return null;

	const nominations: ParsedNomination[] = [];

	for (const row of rows) {
		const nomination = parseNominationFromRow(row);
		if (nomination) {
			nominations.push(nomination);
		}
	}

	if (nominations.length === 0) return null;

	return { name: sectionTitle, nominations };
}

/**
 * Extracts a nomination from a table row by looking for known column names.
 */
function parseNominationFromRow(row: Record<string, unknown>): ParsedNomination | null {
	let personName: string | undefined;
	let workTitle: string | undefined;

	for (const [originalKey, value] of Object.entries(row)) {
		if (typeof value !== "string") continue;

		const key = originalKey.toLowerCase();

		if (key.includes("nominee") || key.includes("actor") || key.includes("director")) {
			personName = value;
		}

		if (key.includes("film") || key.includes("work") || key.includes("title")) {
			workTitle = value;
		}
	}

	if (!personName && !workTitle) return null;

	return toNomination(personName, workTitle);
}

// ---------------------------------------------------------------------------
// Compact two-per-row table parsing (recent Academy Awards format)
// ---------------------------------------------------------------------------

/**
 * Maps row index to [col1 category name, col2 category name].
 * This layout is used in recent ceremonies (97th, etc.).
 */
const COMPACT_CATEGORY_MAP: Record<number, [string, string]> = {
	0: ["Best Picture", "Best Director"],
	1: ["Best Actor", "Best Actress"],
	2: ["Best Supporting Actor", "Best Supporting Actress"],
	3: ["Best Original Screenplay", "Best Adapted Screenplay"],
	4: ["Best Animated Feature", "Best International Feature Film"],
	5: ["Best Documentary Feature", "Best Documentary Short"],
	6: ["Best Live Action Short", "Best Animated Short"],
	7: ["Best Original Score", "Best Original Song"],
	8: ["Best Sound", "Best Production Design"],
	9: ["Best Cinematography", "Best Makeup and Hairstyling"],
	10: ["Best Costume Design", "Best Film Editing"],
	11: ["Best Visual Effects", ""],
};

function isCompactFormat(rows: unknown[]): boolean {
	const firstRow = rows[0];
	if (!firstRow || typeof firstRow !== "object") return false;

	return (
		"col1" in firstRow &&
		"col2" in firstRow &&
		typeof firstRow.col1 === "object" &&
		firstRow.col1 !== null &&
		"text" in firstRow.col1
	);
}

/**
 * Extracts the text content from a compact table cell (col1 or col2).
 */
function extractCompactCellText(row: Record<string, unknown>, colKey: string): string {
	if (!(colKey in row)) return "";
	const cell = row[colKey];
	if (typeof cell === "object" && cell !== null && "text" in cell) {
		return (cell as { text: string }).text;
	}
	return "";
}

/**
 * Parses a compact column into a category if it has nominations.
 */
function parseCompactColumn(
	row: Record<string, unknown>,
	colKey: string,
	categoryName: string,
): ParsedCategory | null {
	if (!categoryName) return null;

	const text = extractCompactCellText(row, colKey);
	if (!text) return null;

	const nominations = parseBulletPointNominations(text);
	if (nominations.length === 0) return null;

	return { name: categoryName, nominations };
}

/**
 * Parses both columns of a single compact table row into categories.
 */
function parseCompactRow(
	row: Record<string, unknown>,
	categoryNames: [string, string],
): ParsedCategory[] {
	const results: ParsedCategory[] = [];

	const col1 = parseCompactColumn(row, "col1", categoryNames[0]);
	if (col1) results.push(col1);

	const col2 = parseCompactColumn(row, "col2", categoryNames[1]);
	if (col2) results.push(col2);

	return results;
}

function parseCompactAwardsTable(table: { json(): unknown }): ParsedCategory[] | null {
	const jsonResult = table.json();
	if (!jsonResult || typeof jsonResult !== "object") return null;

	const rows = Array.isArray(jsonResult) ? jsonResult : [];
	if (rows.length === 0 || !isCompactFormat(rows)) return null;

	const categories: ParsedCategory[] = [];

	for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
		const row = rows[rowIndex];
		if (!row || typeof row !== "object") continue;

		const categoryNames = COMPACT_CATEGORY_MAP[rowIndex];
		if (!categoryNames) continue;

		categories.push(...parseCompactRow(row as Record<string, unknown>, categoryNames));
	}

	return categories.length > 0 ? categories : null;
}

// ---------------------------------------------------------------------------
// Bullet-point nomination parsing
// ---------------------------------------------------------------------------

/**
 * Parses bullet-point formatted nomination text.
 *
 * Format: "* Winner – details ‡ ** Nominee – details ** Nominee – details"
 * All nominations live on ONE line, separated by " ** " markers.
 */
function parseBulletPointNominations(text: string): ParsedNomination[] {
	const nominations: ParsedNomination[] = [];

	const parts = text.split(" ** ");

	for (let i = 0; i < parts.length; i++) {
		let part = parts[i]?.trim();
		if (!part) continue;

		// Remove leading * markers and the ‡ (dagger) symbol
		part = part.replace(/^\*+ /, "").replace(/‡/g, "").trim();

		// Split on " – " to separate the main entity from details
		const segments = part.split(" – ");
		if (segments.length === 0) continue;

		const mainPart = segments[0]?.trim();
		const details = segments.slice(1).join(" – ").trim();

		if (!mainPart) continue;

		const nomination = parseBulletPointNomination(mainPart, details);
		if (nomination) {
			nominations.push(nomination);
		}
	}

	return nominations;
}

/**
 * Parses a single bullet-point nomination into title/subtitle.
 *
 * Detects whether the main part is a person name or a work title:
 *   - Person: "Adrien Brody" → title=person, subtitle=work (from details)
 *   - Work: "Anora" → title=work, subtitle=person/details
 */
function parseBulletPointNomination(mainPart: string, details: string): ParsedNomination | null {
	// Heuristic: person names start with "Firstname Lastname" pattern,
	// but common English articles indicate a work title (e.g. "The Brutalist").
	// Use Unicode-aware \p{Lu}/\p{Ll} for accented names like "Timothée Chalamet".
	const startsWithArticle = /^(The|A|An) /i.test(mainPart);
	const looksLikePersonName = /^\p{Lu}\p{Ll}+ \p{Lu}/u.test(mainPart);
	const isPersonName = looksLikePersonName && !startsWithArticle;

	if (isPersonName) {
		// Main part is a person name
		const subtitle = extractWorkFromDetails(details);
		return {
			title: mainPart,
			subtitle: subtitle || details,
			imageUrl: null,
		};
	}

	// Main part is a work title
	const subtitle = extractPersonFromDetails(details);
	return {
		title: mainPart,
		subtitle: subtitle || details,
		imageUrl: null,
	};
}

/**
 * Extracts a work title from nomination details.
 * Looks for patterns like "WorkTitle as CharacterName".
 */
function extractWorkFromDetails(details: string): string | undefined {
	if (!details) return undefined;

	const asMatch = details.match(/^(.+?) as /);
	if (asMatch?.[1]) {
		return asMatch[1].trim();
	}

	return undefined;
}

/**
 * Extracts a person name from nomination details.
 * Looks for patterns like "Name1, Name2, and Name3, producers".
 */
function extractPersonFromDetails(details: string): string | undefined {
	if (!details) return undefined;

	const peopleMatch = details.match(/^(.+?),\s*(producers?|directors?)/i);
	if (peopleMatch?.[1]) {
		const names = peopleMatch[1].split(/,| and /).map((n) => n.trim());
		if (names.length > 0 && names[0]) {
			return names[0];
		}
	}

	return undefined;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a ParsedNomination from person/work pair.
 * Title is the primary display text, subtitle is secondary.
 */
function toNomination(
	personName: string | undefined,
	workTitle: string | undefined,
): ParsedNomination {
	if (personName && workTitle) {
		return { title: personName, subtitle: workTitle, imageUrl: null };
	}

	if (personName) {
		return { title: personName, subtitle: "", imageUrl: null };
	}

	return { title: workTitle ?? "", subtitle: "", imageUrl: null };
}

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
	/** Wikipedia page slug for the primary entity (film or person). Used for thumbnail fetch. */
	wikipediaSlug?: string;
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

	// Enrich nominations with thumbnail images from linked Wikipedia pages
	await enrichWithThumbnails(categories);

	return { name: ceremonyName, categories };
}

/**
 * Fetches a thumbnail URL from the Wikipedia REST API.
 * Uses /api/rest_v1/page/summary which returns thumbnails directly.
 * Much faster than fetching the full page via wtf_wikipedia.
 */
async function fetchThumbnail(slug: string): Promise<string | null> {
	try {
		const encoded = encodeURIComponent(slug.replace(/ /g, "_"));
		const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`);
		if (!res.ok) return null;
		const data = await res.json();
		return data.thumbnail?.source ?? null;
	} catch {
		return null;
	}
}

/**
 * Enriches nominations with thumbnail images from linked Wikipedia pages.
 * Fetches in parallel batches to avoid overwhelming the API.
 */
async function enrichWithThumbnails(categories: ParsedCategory[]): Promise<void> {
	const BATCH_SIZE = 10;
	const tasks: Array<{ nomination: ParsedNomination; slug: string }> = [];

	for (const cat of categories) {
		for (const nom of cat.nominations) {
			if (nom.imageUrl) continue;
			if (nom.wikipediaSlug) {
				tasks.push({ nomination: nom, slug: nom.wikipediaSlug });
			}
		}
	}

	for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
		const batch = tasks.slice(i, i + BATCH_SIZE);
		const results = await Promise.all(
			batch.map(({ slug }) => fetchThumbnail(slug)),
		);
		for (let j = 0; j < batch.length; j++) {
			batch[j].nomination.imageUrl = results[j];
		}
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
	categoryNames: string[],
): ParsedCategory[] {
	try {
		// Try compact two-per-row format first (returns multiple categories)
		const compactCategories = parseCompactAwardsTable(table, categoryNames);
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
 * Category names are extracted from {{Award category}} wikitext templates
 * rather than hardcoded, so new categories (like Best Casting) are handled
 * automatically.
 */
function extractCategories(doc: Document): ParsedCategory[] {
	const categories: ParsedCategory[] = [];
	const categoryNames = extractCategoryNamesFromWikitext(doc);

	const sectionsResult = doc.sections();
	const sections = Array.isArray(sectionsResult) ? sectionsResult : [sectionsResult];

	for (const section of sections) {
		const sectionTitle = section.title();
		if (!sectionTitle || shouldSkipSection(sectionTitle)) continue;

		for (const table of getSectionTables(section)) {
			categories.push(...parseCategoriesFromTable(sectionTitle, table, categoryNames));
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
/**
 * Extracts category names from {{Award category}} wikitext templates.
 * These templates appear in order: col1 of row 0, col2 of row 0, col1 of row 1, etc.
 * This replaces the old hardcoded COMPACT_CATEGORY_MAP.
 */
function extractCategoryNamesFromWikitext(doc: Document): string[] {
	let wikitext = doc.wikitext();
	const names: string[] = [];

	// Strip <ref>...</ref> blocks and <ref .../> self-closing tags BEFORE matching.
	// Some Award category templates have <ref> tags inside them (e.g., 97th's
	// Adapted Screenplay) which break the template-closing regex.
	wikitext = wikitext.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "");
	wikitext = wikitext.replace(/<ref[^/]*\/>/g, "");

	// Match {{Award category|COLOR|[[Academy Award for X|Display Name]]}}
	// or    {{Award category|COLOR|[[Category Name]]}}
	// or    {{Award category|COLOR|Plain Text}}
	const regex = /\{\{Award category\|[^|]*\|(.*?)\}\}/g;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(wikitext)) !== null) {
		const raw = match[1];
		if (!raw) continue;

		// Extract display name from wikilink: [[Academy Award for X|Display Name]] → Display Name
		// or [[Category Name]] → Category Name
		const linkMatch = raw.match(/\[\[(?:Academy Award for )?([^\]|]+?)(?:\|([^\]]+))?\]\]/);
		let name: string;
		if (linkMatch) {
			name = (linkMatch[2] || linkMatch[1] || "").trim();
		} else {
			// Plain text (no wikilink)
			name = raw.replace(/\[\[.*?\]\]/g, "").trim();
		}

		if (name) {
			names.push(shortenCategoryName(name));
		}
	}

	return names;
}

/**
 * Shorten official Academy category names to common display names.
 * "Best Actor in a Leading Role" → "Best Actor"
 * "Best Actor in a Supporting Role" → "Best Supporting Actor"
 * "Best Writing (Original Screenplay)" → "Best Original Screenplay"
 */
function shortenCategoryName(name: string): string {
	return name
		.replace(/Best (Actor|Actress) in a Leading Role/i, "Best $1")
		.replace(/Best (Actor|Actress) in a Supporting Role/i, "Best Supporting $1")
		.replace(/Best Writing \((.+)\)/i, "Best $1")
		.replace(/Best Music \((.+)\)/i, "Best $1")
		.replace(/Best Short Film \((.+)\)/i, "Best $1 Short")
		.replace(/Feature Film/i, "Feature")
		.replace(/Short Film/i, "Short")
		.replace(/Best Directing/i, "Best Director")
		.trim()
		.replace(/\s+/g, " ");
}

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

interface CellData {
	text: string;
	links?: Array<{ text?: string; page?: string; type?: string }>;
}

/**
 * Extracts the text and links from a compact table cell.
 */
function extractCompactCell(row: Record<string, unknown>, colKey: string): CellData {
	if (!(colKey in row)) return { text: "", links: [] };
	const cell = row[colKey];
	if (typeof cell === "object" && cell !== null && "text" in cell) {
		const c = cell as CellData;
		return { text: c.text ?? "", links: c.links ?? [] };
	}
	return { text: "", links: [] };
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

	const cell = extractCompactCell(row, colKey);
	if (!cell.text) return null;

	const nominations = parseBulletPointNominations(cell.text);
	if (nominations.length === 0) return null;

	// Match Wikipedia slugs to nominations using the cell's links
	assignWikipediaSlugs(nominations, cell.links ?? []);

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

function parseCompactAwardsTable(
	table: { json(): unknown },
	categoryNames: string[],
): ParsedCategory[] | null {
	const jsonResult = table.json();
	if (!jsonResult || typeof jsonResult !== "object") return null;

	const rows = Array.isArray(jsonResult) ? jsonResult : [];
	if (rows.length === 0 || !isCompactFormat(rows)) return null;

	// Category names are ordered: col1-row0, col2-row0, col1-row1, col2-row1, ...
	// So row N uses names at indices N*2 and N*2+1
	const categories: ParsedCategory[] = [];

	for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
		const row = rows[rowIndex];
		if (!row || typeof row !== "object") continue;

		const col1Name = categoryNames[rowIndex * 2] ?? `Category ${rowIndex * 2 + 1}`;
		const col2Name = categoryNames[rowIndex * 2 + 1] ?? `Category ${rowIndex * 2 + 2}`;

		categories.push(
			...parseCompactRow(row as Record<string, unknown>, [col1Name, col2Name]),
		);
	}

	return categories.length > 0 ? categories : null;
}

// ---------------------------------------------------------------------------
// Bullet-point nomination parsing
// ---------------------------------------------------------------------------

/**
 * Parses bullet-point formatted nomination text.
 *
 * Handles two formats:
 *   1. " ** " separators (some ceremonies): "* Winner ‡ ** Nominee ** Nominee"
 *   2. " * " separators (98th and others):  "* Nominee * Nominee * Nominee"
 * Splits on whichever separator is present, preferring " ** " if found.
 */
function parseBulletPointNominations(text: string): ParsedNomination[] {
	const nominations: ParsedNomination[] = [];

	// Determine separator: prefer " ** " if present, else split on " * "
	const separator = text.includes(" ** ") ? " ** " : " * ";
	const parts = text.split(separator);

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
// Wikipedia slug assignment
// ---------------------------------------------------------------------------

/**
 * Matches nominations to their Wikipedia page slugs using the cell's links.
 * For each nomination, finds the first link whose text matches the title.
 * Prefers the film/work link (for poster thumbnails) over person links.
 */
function assignWikipediaSlugs(
	nominations: ParsedNomination[],
	links: Array<{ text?: string; page?: string; type?: string }>,
): void {
	const internalLinks = links.filter((l) => l.type === "internal" && l.page);

	for (const nom of nominations) {
		// Try to find a link matching the nomination title
		const titleMatch = internalLinks.find(
			(l) => (l.text ?? l.page ?? "").toLowerCase() === nom.title.toLowerCase(),
		);
		if (titleMatch?.page) {
			nom.wikipediaSlug = titleMatch.page;
			continue;
		}

		// Fuzzy: title might be shortened (e.g. "Bugonia" vs "Bugonia (film)")
		const fuzzyMatch = internalLinks.find(
			(l) => l.page?.toLowerCase().startsWith(nom.title.toLowerCase()),
		);
		if (fuzzyMatch?.page) {
			nom.wikipediaSlug = fuzzyMatch.page;
		}
	}
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

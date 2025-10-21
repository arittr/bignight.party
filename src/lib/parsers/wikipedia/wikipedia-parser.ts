/**
 * Wikipedia Parser - Database-agnostic Wikipedia page parser
 *
 * This module fetches Wikipedia pages and extracts event data.
 * NO Prisma imports allowed - parser must be database-agnostic.
 */

import wtf from "wtf_wikipedia";
import type { ParsedEvent, ParsedCategory, ParsedNomination } from "./types";

/**
 * Custom error classes for better error handling
 */
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

/**
 * Fetches the main image URL for a Wikipedia page
 *
 * @param wikipediaSlug - The Wikipedia page slug (e.g., "Cillian_Murphy")
 * @returns Image URL or null if no image found
 */
export async function fetchWikipediaImage(wikipediaSlug: string): Promise<string | null> {
  try {
    const fetchResult = await wtf.fetch(wikipediaSlug);

    if (!fetchResult) {
      return null;
    }

    // wtf_wikipedia can return Document or Document[] - ensure we get single Document
    const doc = Array.isArray(fetchResult) ? fetchResult[0] : fetchResult;

    if (!doc) {
      return null;
    }

    // Get the first image from the page
    const images = doc.images();

    if (!images || images.length === 0) {
      return null;
    }

    // Get the main image (first one)
    const mainImage = images[0];

    // Get the full-size URL
    const imageUrl = mainImage.url();

    return imageUrl || null;
  } catch (error) {
    // If page doesn't exist or API fails, return null
    console.warn(`Failed to fetch image for ${wikipediaSlug}:`, error);
    return null;
  }
}

/**
 * Enriches parsed event data with images for all people and works
 * Fetches images from Wikipedia for each unique person and work slug
 *
 * @param parsedEvent - The parsed event data
 * @returns The same event with image URLs populated
 */
export async function enrichWithImages(parsedEvent: ParsedEvent): Promise<ParsedEvent> {
  // Collect unique slugs to avoid duplicate fetches
  const personSlugs = new Set<string>();
  const workSlugs = new Set<string>();

  for (const category of parsedEvent.categories) {
    for (const nomination of category.nominations) {
      if (nomination.personWikipediaSlug) {
        personSlugs.add(nomination.personWikipediaSlug);
      }
      if (nomination.workWikipediaSlug) {
        workSlugs.add(nomination.workWikipediaSlug);
      }
    }
  }

  // Fetch images for unique persons
  const personImages = new Map<string, string | null>();
  for (const slug of personSlugs) {
    const imageUrl = await fetchWikipediaImage(slug);
    personImages.set(slug, imageUrl);
  }

  // Fetch images for unique works
  const workImages = new Map<string, string | null>();
  for (const slug of workSlugs) {
    const imageUrl = await fetchWikipediaImage(slug);
    workImages.set(slug, imageUrl);
  }

  // Populate image URLs in nominations
  for (const category of parsedEvent.categories) {
    for (const nomination of category.nominations) {
      if (nomination.personWikipediaSlug) {
        nomination.personImageUrl = personImages.get(nomination.personWikipediaSlug) || undefined;
      }
      if (nomination.workWikipediaSlug) {
        nomination.workImageUrl = workImages.get(nomination.workWikipediaSlug) || undefined;
      }
    }
  }

  return parsedEvent;
}

/**
 * Validates that a URL is a valid Wikipedia URL
 */
function validateWikipediaUrl(url: string): { isValid: boolean; pageTitle?: string } {
  try {
    const urlObj = new URL(url);

    // Check if it's a wikipedia.org domain
    if (!urlObj.hostname.includes("wikipedia.org")) {
      return { isValid: false };
    }

    // Check if it has /wiki/ path
    if (!urlObj.pathname.includes("/wiki/")) {
      return { isValid: false };
    }

    // Extract page title from URL
    const pathParts = urlObj.pathname.split("/wiki/");
    if (pathParts.length < 2 || !pathParts[1]) {
      return { isValid: false };
    }

    const pageTitle = decodeURIComponent(pathParts[1]);
    return { isValid: true, pageTitle };
  } catch {
    return { isValid: false };
  }
}

/**
 * Extracts Wikipedia slug from a Wikipedia URL or internal link
 * Example: "https://en.wikipedia.org/wiki/Cillian_Murphy" -> "Cillian_Murphy"
 * Example: "[[Cillian Murphy]]" -> "Cillian_Murphy"
 */
function extractWikipediaSlug(link: string): string | undefined {
  if (!link) return undefined;

  // Handle Wikipedia URLs
  if (link.includes("wikipedia.org/wiki/")) {
    const parts = link.split("/wiki/");
    if (parts[1]) {
      return decodeURIComponent(parts[1]).replace(/ /g, "_");
    }
  }

  // Handle internal wiki links like "[[Article Name]]"
  const wikiLinkMatch = link.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
  if (wikiLinkMatch?.[1]) {
    return wikiLinkMatch[1].replace(/ /g, "_");
  }

  // Handle plain text that might be a title
  return link.replace(/ /g, "_");
}

/**
 * Parses a Wikipedia page and extracts event data
 *
 * @param url - Wikipedia URL (e.g., "https://en.wikipedia.org/wiki/97th_Academy_Awards")
 * @returns Parsed event data with categories and nominations
 * @throws WikipediaAPIError if Wikipedia API fails
 * @throws WikipediaParseError if parsing fails or data is invalid
 */
export async function parse(url: string): Promise<ParsedEvent> {
  // Validate URL
  const validation = validateWikipediaUrl(url);
  if (!validation.isValid || !validation.pageTitle) {
    throw new WikipediaParseError(
      "Invalid Wikipedia URL. Must be a valid Wikipedia article URL (e.g., https://en.wikipedia.org/wiki/97th_Academy_Awards)"
    );
  }

  const pageTitle = validation.pageTitle;

  try {
    // Fetch Wikipedia page using wtf_wikipedia
    const fetchResult = await wtf.fetch(pageTitle);

    if (!fetchResult) {
      throw new WikipediaAPIError(`Failed to fetch Wikipedia page: ${pageTitle}`);
    }

    // wtf_wikipedia can return Document or Document[] - ensure we get single Document
    const doc = Array.isArray(fetchResult) ? fetchResult[0] : fetchResult;

    if (!doc) {
      throw new WikipediaAPIError(`Failed to fetch Wikipedia page: ${pageTitle}`);
    }

    // Extract event metadata
    const eventName = doc.title() || pageTitle.replace(/_/g, " ");
    const slug = pageTitle.toLowerCase().replace(/ /g, "-");

    // Try to extract date from infobox or first sentence
    let eventDate = new Date();
    const infobox = doc.infobox();
    if (infobox) {
      // Look for date in infobox
      const dateField = infobox.get("date");
      // The result from get() might have a text() method
      const dateText =
        typeof dateField === "object" && dateField !== null && "text" in dateField
          ? (dateField as { text(): string }).text()
          : undefined;

      if (dateText) {
        const parsedDate = new Date(dateText);
        if (!Number.isNaN(parsedDate.getTime())) {
          eventDate = parsedDate;
        }
      }
    }

    // Extract description from first paragraph
    const firstSentence = doc.sentence(0);
    const description =
      firstSentence && typeof firstSentence === "object" && "text" in firstSentence
        ? (firstSentence as { text(): string }).text()
        : undefined;

    // Extract categories and nominations
    const categories: ParsedCategory[] = [];

    // Look for sections that contain category/nomination data
    // Common section names: "Awards", "Winners and nominees", "Nominations", etc.
    const sectionsResult = doc.sections();
    const sections = Array.isArray(sectionsResult) ? sectionsResult : [sectionsResult];

    for (const section of sections) {
      const sectionTitle = section.title();
      if (!sectionTitle) continue;

      // Skip certain sections
      if (
        sectionTitle.toLowerCase().includes("reference") ||
        sectionTitle.toLowerCase().includes("external") ||
        sectionTitle.toLowerCase().includes("see also")
      ) {
        continue;
      }

      // Look for tables in the section
      const tablesResult = section.tables();
      const tables = Array.isArray(tablesResult)
        ? tablesResult
        : tablesResult
          ? [tablesResult]
          : [];

      for (const table of tables) {
        try {
          // Try parsing as compact format first (returns multiple categories)
          const compactCategories = parseCompactAwardsTable(table);
          if (compactCategories && compactCategories.length > 0) {
            categories.push(...compactCategories);
            continue;
          }

          // Fall back to single category parsing
          const category = parseCategoryFromTable(sectionTitle, table);
          if (category) {
            categories.push(category);
          }
        } catch (error) {
          // Skip tables that can't be parsed as categories
          console.warn(`Failed to parse table in section "${sectionTitle}":`, error);
          continue;
        }
      }
    }

    // If no categories found, this might not be an awards ceremony page
    if (categories.length === 0) {
      throw new WikipediaParseError(
        "No award categories found. This may not be a valid awards ceremony Wikipedia page."
      );
    }

    return {
      name: eventName,
      date: eventDate,
      slug,
      description,
      categories,
    };
  } catch (error) {
    if (error instanceof WikipediaParseError || error instanceof WikipediaAPIError) {
      throw error;
    }

    throw new WikipediaAPIError(
      `Failed to parse Wikipedia page: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Attempts to parse a category from a Wikipedia table
 */
function parseCategoryFromTable(
  sectionTitle: string,
  table: { json(): unknown }
): ParsedCategory | null {
  // Get table data as array of objects
  const jsonResult = table.json();

  // Ensure we have an array
  if (!jsonResult || typeof jsonResult !== "object") return null;
  const rows = Array.isArray(jsonResult) ? jsonResult : [];

  if (rows.length === 0) return null;

  const nominations: ParsedNomination[] = [];

  // Try to parse each row as a nomination
  for (const row of rows) {
    try {
      const nomination = parseNominationFromRow(row);
      if (nomination) {
        nominations.push(nomination);
      }
    } catch {
      // Skip rows that can't be parsed
      continue;
    }
  }

  // Only return category if we found nominations
  if (nominations.length === 0) return null;

  // Default point value (can be customized later)
  const pointValue = 10;

  return {
    name: sectionTitle,
    pointValue,
    nominations,
  };
}

/**
 * Parses a nomination from a table row
 */
function parseNominationFromRow(row: Record<string, unknown>): ParsedNomination | null {
  const nomination: ParsedNomination = {};

  // Look for common field names (case-insensitive)
  const keys = Object.keys(row).map((k) => k.toLowerCase());

  // Check if this nomination won
  // Look for "winner", "result", "outcome" columns
  for (const key of keys) {
    const value = row[Object.keys(row)[keys.indexOf(key)]];
    if (typeof value === "string") {
      if (key.includes("winner") || key.includes("result") || key.includes("outcome")) {
        nomination.isWinner =
          value.toLowerCase().includes("won") ||
          value.toLowerCase().includes("winner") ||
          value === "✓";
      }
    }
  }

  // Extract person/work information
  // Look for "nominee", "name", "film", "work", etc.
  for (const [originalKey, value] of Object.entries(row)) {
    if (typeof value !== "string") continue;

    const key = originalKey.toLowerCase();

    // Person name
    if (key.includes("nominee") || key.includes("actor") || key.includes("director")) {
      nomination.personName = value;
      nomination.personWikipediaSlug = extractWikipediaSlug(value);
    }

    // Work title
    if (key.includes("film") || key.includes("work") || key.includes("title")) {
      nomination.workTitle = value;
      nomination.workWikipediaSlug = extractWikipediaSlug(value);

      // Try to extract year from title (e.g., "Movie (2023)")
      const yearMatch = value.match(/\((\d{4})\)/);
      if (yearMatch?.[1]) {
        nomination.workYear = Number.parseInt(yearMatch[1], 10);
      }
    }
  }

  // Only return if we found at least a person or work
  if (!nomination.personName && !nomination.workTitle) {
    return null;
  }

  return nomination;
}

/**
 * Category name mappings for compact Awards table format
 * Maps row index to [col1 category, col2 category]
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

/**
 * Parses compact Awards table format where each row contains 2 categories
 * This format is used in recent Academy Awards pages (97th, etc.)
 */
function parseCompactAwardsTable(table: { json(): unknown }): ParsedCategory[] | null {
  const jsonResult = table.json();
  if (!jsonResult || typeof jsonResult !== "object") return null;

  const rows = Array.isArray(jsonResult) ? jsonResult : [];
  if (rows.length === 0) return null;

  // Detect compact format: has col1/col2 with bullet-formatted text
  const firstRow = rows[0];
  if (!firstRow || typeof firstRow !== "object") return null;

  const hasCompactFormat =
    "col1" in firstRow &&
    "col2" in firstRow &&
    typeof firstRow.col1 === "object" &&
    firstRow.col1 !== null &&
    "text" in firstRow.col1;

  if (!hasCompactFormat) return null;

  const categories: ParsedCategory[] = [];

  // Parse each row (each row has 2 categories in col1 and col2)
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (!row || typeof row !== "object") continue;

    const categoryNames = COMPACT_CATEGORY_MAP[rowIndex];
    if (!categoryNames) continue; // Unknown row, skip

    // Parse col1 (first category)
    if ("col1" in row && categoryNames[0]) {
      const col1 = row.col1;
      const text =
        typeof col1 === "object" && col1 !== null && "text" in col1
          ? (col1 as { text: string }).text
          : "";

      if (text) {
        const nominations = parseBulletPointNominations(text);
        if (nominations.length > 0) {
          categories.push({
            name: categoryNames[0],
            pointValue: 10,
            nominations,
          });
        }
      }
    }

    // Parse col2 (second category)
    if ("col2" in row && categoryNames[1]) {
      const col2 = row.col2;
      const text =
        typeof col2 === "object" && col2 !== null && "text" in col2
          ? (col2 as { text: string }).text
          : "";

      if (text) {
        const nominations = parseBulletPointNominations(text);
        if (nominations.length > 0) {
          categories.push({
            name: categoryNames[1],
            pointValue: 10,
            nominations,
          });
        }
      }
    }
  }

  return categories.length > 0 ? categories : null;
}

/**
 * Parses bullet-point formatted nomination text
 * Format: * Winner – details ‡ ** Nominee – details ** Nominee – details
 * Note: All nominations are on ONE line, separated by ** markers
 */
function parseBulletPointNominations(text: string): ParsedNomination[] {
  const nominations: ParsedNomination[] = [];

  // Split by ** to get individual nominations
  // First one starts with * (winner), rest start with ** (nominees)
  const parts = text.split(" ** ");

  for (let i = 0; i < parts.length; i++) {
    let part = parts[i]?.trim();
    if (!part) continue;

    // First part might start with * (winner)
    const isWinner = i === 0 && part.startsWith("* ");

    // Remove leading * or ** markers
    part = part.replace(/^\*+ /, "").replace(/‡/g, "").trim();

    // Split by " – " to separate work/person from details
    const segments = part.split(" – ");
    if (segments.length === 0) continue;

    const mainPart = segments[0]?.trim();
    const details = segments.slice(1).join(" – ").trim();

    if (!mainPart) continue;

    // Try to parse the nomination
    const nomination = parseBulletPointNomination(mainPart, details, isWinner);
    if (nomination) {
      nominations.push(nomination);
    }
  }

  return nominations;
}

/**
 * Parses a single bullet-point nomination
 */
function parseBulletPointNomination(
  mainPart: string,
  details: string,
  isWinner: boolean
): ParsedNomination | null {
  const nomination: ParsedNomination = {
    isWinner,
  };

  // Check if mainPart looks like a person name (e.g., "Adrien Brody")
  // vs work title (e.g., "Anora" or "The Brutalist")
  const isPersonName = /^[A-Z][a-z]+ [A-Z]/.test(mainPart);

  if (isPersonName) {
    // This is a person (actor, director, etc.)
    nomination.personName = mainPart;

    // Extract work from details if it mentions "as" or film title in italics
    const asMatch = details.match(/^(.+?) as /);
    if (asMatch?.[1]) {
      nomination.workTitle = asMatch[1].trim();
    }

    // Extract Wikipedia slug from person name
    nomination.personWikipediaSlug = mainPart.replace(/ /g, "_");
  } else {
    // This is a work (film, song, etc.)
    nomination.workTitle = mainPart;
    nomination.workWikipediaSlug = mainPart.replace(/ /g, "_");

    // Extract person names from details (producers, directors, etc.)
    // Format: "Name1, Name2, and Name3, producers"
    const peopleMatch = details.match(/^(.+?),\s*(producers?|directors?)/i);
    if (peopleMatch?.[1]) {
      const names = peopleMatch[1].split(/,| and /).map((n) => n.trim());
      if (names.length > 0 && names[0]) {
        nomination.personName = names[0];
        nomination.personWikipediaSlug = names[0].replace(/ /g, "_");
      }
    }
  }

  // Extract year if present
  const yearMatch = mainPart.match(/\((\d{4})\)/);
  if (yearMatch?.[1]) {
    nomination.workYear = Number.parseInt(yearMatch[1], 10);
  }

  return nomination;
}

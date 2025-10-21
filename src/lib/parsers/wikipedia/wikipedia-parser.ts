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

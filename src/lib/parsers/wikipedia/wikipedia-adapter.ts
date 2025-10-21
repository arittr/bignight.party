/**
 * Wikipedia Adapter - Pure transformation layer
 *
 * This module transforms parsed Wikipedia data to Prisma-compatible types.
 * NO external API calls, NO database access - pure transformation only.
 */

import type { Prisma } from "@prisma/client";
import type { ParsedEvent, ParsedNomination } from "./types";

/**
 * Preview data structure for UI display
 */
export type PreviewData = {
  url: string;
  event: {
    name: string;
    date: Date;
    slug: string;
    description?: string;
  };
  categoryCount: number;
  nominationCount: number;
  categories: Array<{
    name: string;
    pointValue: number;
    nominationCount: number;
    sampleNominations: Array<{
      personName?: string;
      workTitle?: string;
      isWinner?: boolean;
    }>;
  }>;
};

/**
 * Transforms parsed Wikipedia data to preview format for UI
 *
 * @param parsed - Parsed Wikipedia event data
 * @param url - Original Wikipedia URL
 * @returns Preview data structure for UI display
 */
export function transformToPreview(parsed: ParsedEvent, url: string): PreviewData {
  const totalNominations = parsed.categories.reduce(
    (sum, category) => sum + category.nominations.length,
    0
  );

  return {
    categories: parsed.categories.map((category) => ({
      name: category.name.trim(),
      nominationCount: category.nominations.length,
      pointValue: category.pointValue,
      sampleNominations: category.nominations.slice(0, 3).map((nom) => ({
        isWinner: nom.isWinner,
        personName: nom.personName?.trim(),
        workTitle: nom.workTitle?.trim(),
      })),
    })),
    categoryCount: parsed.categories.length,
    event: {
      date: parsed.date,
      description: parsed.description?.trim(),
      name: parsed.name.trim(),
      slug: parsed.slug.trim(),
    },
    nominationCount: totalNominations,
    url,
  };
}

/**
 * Transforms parsed Wikipedia data to Prisma EventCreateInput format
 *
 * This creates a nested create structure that will be used in a transaction
 * to create the Event with all related Categories and Nominations.
 *
 * Note: Person and Work entities are NOT created here - they must be
 * deduplicated and created separately in the service layer using
 * findOrCreateByWikipediaSlug.
 *
 * @param parsed - Parsed Wikipedia event data
 * @returns Prisma EventCreateInput with nested categories
 */
export function transformToPrismaInput(parsed: ParsedEvent): Prisma.EventCreateInput {
  return {
    categories: {
      create: parsed.categories.map((category, categoryIndex) => ({
        isRevealed: false,
        name: category.name.trim(),
        order: categoryIndex,
        points: category.pointValue,
        // Note: nominations will be connected after Person/Work deduplication
        // The service layer handles creating nominations with proper personId/workId
      })),
    },
    description: parsed.description?.trim(),
    eventDate: parsed.date,
    name: parsed.name.trim(),
    slug: parsed.slug.trim(),
  };
}

/**
 * Extracts unique Person entities from parsed data for deduplication
 *
 * Returns a map of Wikipedia slug -> person data. The service layer will use
 * this to call findOrCreateByWikipediaSlug for each unique person.
 *
 * @param parsed - Parsed Wikipedia event data
 * @returns Map of Wikipedia slug to person data
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex deduplication logic with multiple conditionals
export function extractUniquePersons(parsed: ParsedEvent): Map<
  string,
  {
    wikipediaSlug: string;
    name: string;
    imageUrl?: string;
  }
> {
  const persons = new Map<
    string,
    {
      wikipediaSlug: string;
      name: string;
      imageUrl?: string;
    }
  >();

  for (const category of parsed.categories) {
    for (const nomination of category.nominations) {
      if (nomination.personWikipediaSlug && nomination.personName) {
        // Only add if we haven't seen this slug before
        if (!persons.has(nomination.personWikipediaSlug)) {
          persons.set(nomination.personWikipediaSlug, {
            imageUrl: nomination.personImageUrl,
            name: nomination.personName.trim(),
            wikipediaSlug: nomination.personWikipediaSlug,
          });
        }
      }
    }
  }

  return persons;
}

/**
 * Extracts unique Work entities from parsed data for deduplication
 *
 * Returns a map of Wikipedia slug -> work data. The service layer will use
 * this to call findOrCreateByWikipediaSlug for each unique work.
 *
 * @param parsed - Parsed Wikipedia event data
 * @returns Map of Wikipedia slug to work data
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex deduplication logic with multiple conditionals
export function extractUniqueWorks(parsed: ParsedEvent): Map<
  string,
  {
    wikipediaSlug: string;
    title: string;
    imageUrl?: string;
    year?: number;
  }
> {
  const works = new Map<
    string,
    {
      wikipediaSlug: string;
      title: string;
      imageUrl?: string;
      year?: number;
    }
  >();

  for (const category of parsed.categories) {
    for (const nomination of category.nominations) {
      if (nomination.workWikipediaSlug && nomination.workTitle) {
        // Only add if we haven't seen this slug before
        if (!works.has(nomination.workWikipediaSlug)) {
          works.set(nomination.workWikipediaSlug, {
            imageUrl: nomination.workImageUrl,
            title: nomination.workTitle.trim(),
            wikipediaSlug: nomination.workWikipediaSlug,
            year: nomination.workYear,
          });
        }
      }
    }
  }

  return works;
}

/**
 * Builds nomination text from parsed nomination data
 *
 * This creates a human-readable text representation of the nomination
 * (e.g., "Cillian Murphy for Oppenheimer")
 *
 * @param nomination - Parsed nomination data
 * @returns Human-readable nomination text
 */
export function buildNominationText(nomination: ParsedNomination): string {
  const parts: string[] = [];

  if (nomination.personName) {
    parts.push(nomination.personName.trim());
  }

  if (nomination.workTitle) {
    if (parts.length > 0) {
      parts.push("for");
    }
    parts.push(nomination.workTitle.trim());
  }

  // Fallback if no person or work name
  if (parts.length === 0) {
    return "Unknown Nomination";
  }

  return parts.join(" ");
}

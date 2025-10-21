// biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: TODO: deal with this later
/**
 * Wikipedia Import Service - Orchestration layer for Wikipedia event import
 *
 * This service coordinates parsing, deduplication, and database transactions.
 * Provides two modes:
 * - preview: Parse and transform without saving to database
 * - commit: Save to database atomically in a transaction
 *
 * Architecture: Services call models, NOT Prisma directly
 */

import { WorkType } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import * as personModel from "@/lib/models/person";
import * as workModel from "@/lib/models/work";
import * as wikipediaAdapter from "@/lib/parsers/wikipedia/wikipedia-adapter";
import * as wikipediaParser from "@/lib/parsers/wikipedia/wikipedia-parser";

/**
 * Custom error classes for service-level errors
 */
export class ImportServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportServiceError";
  }
}

/**
 * Infers WorkType from category name
 * Maps common category patterns to WorkType enum values
 *
 * @param categoryName - The category name (e.g., "Best Picture", "Best Song")
 * @returns WorkType enum value (defaults to FILM)
 */
function inferWorkType(categoryName: string): WorkType {
  const lowerName = categoryName.toLowerCase();

  // TV Show patterns
  if (
    lowerName.includes("television") ||
    lowerName.includes("tv series") ||
    lowerName.includes("miniseries") ||
    lowerName.includes("limited series") ||
    lowerName.includes("tv movie")
  ) {
    return WorkType.TV_SHOW;
  }

  // Song patterns
  if (
    lowerName.includes("original song") ||
    lowerName.includes("best song") ||
    lowerName === "song"
  ) {
    return WorkType.SONG;
  }

  // Album patterns
  if (
    lowerName.includes("album") ||
    lowerName.includes("soundtrack") ||
    lowerName.includes("original score")
  ) {
    return WorkType.ALBUM;
  }

  // Play patterns
  if (lowerName.includes("play") || lowerName.includes("musical")) {
    return WorkType.PLAY;
  }

  // Book patterns
  if (
    lowerName.includes("book") ||
    lowerName.includes("novel") ||
    lowerName.includes("adapted screenplay")
  ) {
    return WorkType.BOOK;
  }

  // Default to FILM for most awards categories
  // (Picture, Director, Acting, Cinematography, etc.)
  return WorkType.FILM;
}

/**
 * Preview mode: Parse Wikipedia page and return preview data WITHOUT saving to database
 *
 * @param url - Wikipedia URL (e.g., "https://en.wikipedia.org/wiki/97th_Academy_Awards")
 * @returns Preview data structure for UI display
 * @throws WikipediaParseError if parsing fails
 * @throws WikipediaAPIError if Wikipedia API fails
 */
export async function previewImport(url: string) {
  // Call parser to fetch and parse Wikipedia page
  let parsed = await wikipediaParser.parse(url);

  // Enrich with images from Wikipedia
  parsed = await wikipediaParser.enrichWithImages(parsed);

  // Transform to preview format (no database access)
  const preview = wikipediaAdapter.transformToPreview(parsed, url);

  return preview;
}

/**
 * Commit mode: Parse Wikipedia page and save to database atomically
 *
 * This function:
 * 1. Parses Wikipedia page
 * 2. Deduplicates Person and Work entities using model methods
 * 3. Creates Event, Categories, and Nominations in a single transaction
 * 4. Rolls back on any error (no partial imports)
 *
 * @param url - Wikipedia URL (e.g., "https://en.wikipedia.org/wiki/97th_Academy_Awards")
 * @returns Created Event with all relations
 * @throws WikipediaParseError if parsing fails
 * @throws WikipediaAPIError if Wikipedia API fails
 * @throws ImportServiceError if database operation fails
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex orchestration of deduplication and transaction logic
export async function commitImport(url: string) {
  // Parse and transform
  let parsed = await wikipediaParser.parse(url);

  // Enrich with images from Wikipedia
  parsed = await wikipediaParser.enrichWithImages(parsed);

  try {
    // Start transaction - all-or-nothing atomic operation
    return await prisma.$transaction(async (tx) => {
      // Step 1: Deduplicate Person entities using adapter helper
      const uniquePersons = wikipediaAdapter.extractUniquePersons(parsed);
      const personIdMap = new Map<string, string>();

      for (const [slug, personData] of uniquePersons) {
        const person = await personModel.findOrCreateByWikipediaSlug(personData);
        personIdMap.set(slug, person.id);
      }

      // Step 2: Deduplicate Work entities
      // Build a map of works with their inferred types based on category context
      const workIdMap = new Map<string, string>();
      const processedWorks = new Set<string>();

      // Iterate through categories to infer work types from context
      for (const category of parsed.categories) {
        const categoryWorkType = inferWorkType(category.name);

        for (const nomination of category.nominations) {
          if (nomination.workWikipediaSlug && nomination.workTitle) {
            // Skip if already processed
            if (processedWorks.has(nomination.workWikipediaSlug)) {
              continue;
            }

            // Create work with inferred type
            const work = await workModel.findOrCreateByWikipediaSlug({
              imageUrl: nomination.workImageUrl,
              title: nomination.workTitle.trim(),
              type: categoryWorkType,
              wikipediaSlug: nomination.workWikipediaSlug,
              year: nomination.workYear,
            });

            workIdMap.set(nomination.workWikipediaSlug, work.id);
            processedWorks.add(nomination.workWikipediaSlug);
          }
        }
      }

      // Step 3: Create Event with nested Categories and Nominations
      const event = await tx.event.create({
        data: {
          categories: {
            create: parsed.categories.map((category, categoryIndex) => ({
              isRevealed: false,
              name: category.name.trim(),
              nominations: {
                create: category.nominations.map((nomination) => {
                  // Get deduplicated entity IDs
                  const personId = nomination.personWikipediaSlug
                    ? personIdMap.get(nomination.personWikipediaSlug)
                    : undefined;
                  const workId = nomination.workWikipediaSlug
                    ? workIdMap.get(nomination.workWikipediaSlug)
                    : undefined;

                  // Build nomination text using adapter helper
                  const nominationText = wikipediaAdapter.buildNominationText(nomination);

                  return {
                    nominationText,
                    personId,
                    workId,
                  };
                }),
              },
              order: categoryIndex,
              points: category.pointValue,
            })),
          },
          description: parsed.description?.trim(),
          eventDate: parsed.date,
          name: parsed.name.trim(),
          slug: parsed.slug.trim(),
        },
        include: {
          categories: {
            include: {
              nominations: {
                include: {
                  person: true,
                  work: true,
                },
              },
            },
          },
        },
      });

      return event;
    });
  } catch (error) {
    // Re-throw parser/API errors as-is
    if (
      error instanceof wikipediaParser.WikipediaParseError ||
      error instanceof wikipediaParser.WikipediaAPIError
    ) {
      throw error;
    }

    // Wrap database errors with context
    throw new ImportServiceError(
      `Failed to import Wikipedia event: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

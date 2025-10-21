"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { adminAction } from "@/lib/actions/safe-action";
import * as wikipediaImportService from "@/lib/services/wikipedia-import-service";
import { WikipediaParseError, WikipediaAPIError } from "@/lib/parsers/wikipedia/wikipedia-parser";
import { wikipediaUrlSchema } from "@/schemas/wikipedia-import-schema";
import { routes } from "@/lib/routes";

/**
 * Preview Wikipedia import without saving to database
 *
 * This action:
 * - Validates the Wikipedia URL
 * - Calls the service to parse and transform the page
 * - Returns preview data for admin validation
 * - Does NOT save anything to the database
 *
 * Requires: Admin role (via adminAction middleware)
 */
export const previewImportAction = adminAction
  .schema(wikipediaUrlSchema)
  .action(async ({ parsedInput }) => {
    try {
      const preview = await wikipediaImportService.previewImport(parsedInput.url);
      return { success: true, data: preview };
    } catch (error) {
      // Handle known Wikipedia parsing errors
      if (error instanceof WikipediaParseError) {
        return {
          success: false,
          error: `Failed to parse Wikipedia page: ${error.message}`,
        };
      }

      // Handle known Wikipedia API errors
      if (error instanceof WikipediaAPIError) {
        return {
          success: false,
          error: `Failed to fetch Wikipedia page: ${error.message}`,
        };
      }

      // Re-throw unexpected errors for next-safe-action to handle
      throw error;
    }
  });

/**
 * Confirm and commit Wikipedia import to database
 *
 * This action:
 * - Validates the Wikipedia URL
 * - Calls the service to parse, deduplicate, and save atomically
 * - Redirects to the created event detail page on success
 * - Handles duplicate slug errors and other failures
 *
 * Requires: Admin role (via adminAction middleware)
 */
export const confirmImportAction = adminAction
  .schema(wikipediaUrlSchema)
  .action(async ({ parsedInput }) => {
    try {
      const event = await wikipediaImportService.commitImport(parsedInput.url);

      // Redirect to event detail page using centralized routes
      redirect(routes.admin.events.detail(event.id));
    } catch (error) {
      // Handle Prisma unique constraint violations (duplicate slug)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return {
          success: false,
          error: "Event already imported. An event with this slug already exists in the database.",
        };
      }

      // Handle known Wikipedia parsing errors
      if (error instanceof WikipediaParseError) {
        return {
          success: false,
          error: `Failed to parse Wikipedia page: ${error.message}`,
        };
      }

      // Handle known Wikipedia API errors
      if (error instanceof WikipediaAPIError) {
        return {
          success: false,
          error: `Failed to fetch Wikipedia page: ${error.message}`,
        };
      }

      // Handle service-level import errors
      if (error instanceof wikipediaImportService.ImportServiceError) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Re-throw unexpected errors for next-safe-action to handle
      throw error;
    }
  });

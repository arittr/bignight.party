"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { adminAction } from "@/lib/actions/safe-action";
import { WikipediaAPIError, WikipediaParseError } from "@/lib/parsers/wikipedia/wikipedia-parser";
import { routes } from "@/lib/routes";
import * as wikipediaImportService from "@/lib/services/wikipedia-import-service";
import { wikipediaUrlSchema } from "@/schemas/wikipedia-import-schema";

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
      return { data: preview, success: true };
    } catch (error) {
      // Handle known Wikipedia parsing errors
      if (error instanceof WikipediaParseError) {
        return {
          error: `Failed to parse Wikipedia page: ${error.message}`,
          success: false,
        };
      }

      // Handle known Wikipedia API errors
      if (error instanceof WikipediaAPIError) {
        return {
          error: `Failed to fetch Wikipedia page: ${error.message}`,
          success: false,
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
          error: "Event already imported. An event with this slug already exists in the database.",
          success: false,
        };
      }

      // Handle known Wikipedia parsing errors
      if (error instanceof WikipediaParseError) {
        return {
          error: `Failed to parse Wikipedia page: ${error.message}`,
          success: false,
        };
      }

      // Handle known Wikipedia API errors
      if (error instanceof WikipediaAPIError) {
        return {
          error: `Failed to fetch Wikipedia page: ${error.message}`,
          success: false,
        };
      }

      // Handle service-level import errors
      if (error instanceof wikipediaImportService.ImportServiceError) {
        return {
          error: error.message,
          success: false,
        };
      }

      // Re-throw unexpected errors for next-safe-action to handle
      throw error;
    }
  });

import { z } from "zod";

/**
 * Wikipedia URL validation schema
 * Validates that the URL is a properly formatted Wikipedia article URL
 */
export const wikipediaUrlSchema = z.object({
  url: z
    .string()
    .url("Must be a valid URL")
    .refine((url) => url.includes("wikipedia.org/wiki/"), {
      message:
        "Must be a valid Wikipedia article URL (e.g., https://en.wikipedia.org/wiki/97th_Academy_Awards)",
    }),
});

/**
 * Preview data schema for Wikipedia import preview
 * Defines the structure returned by previewImportAction
 */
export const previewDataSchema = z.object({
  url: z.string().url(),
  event: z.object({
    name: z.string(),
    date: z.date(),
    slug: z.string(),
    description: z.string().optional(),
  }),
  categoryCount: z.number().int().min(0),
  nominationCount: z.number().int().min(0),
  categories: z
    .array(
      z.object({
        name: z.string(),
        pointValue: z.number().int(),
        nominationCount: z.number().int().min(0),
      })
    )
    .optional(),
});

export type WikipediaUrlInput = z.infer<typeof wikipediaUrlSchema>;
export type PreviewData = z.infer<typeof previewDataSchema>;

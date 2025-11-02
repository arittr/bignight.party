/**
 * Wire-to-Domain Transformation Utilities
 *
 * These utilities transform data from wire format (JSON/HTTP) to domain types
 * used in services and business logic.
 *
 * Pattern:
 * - Schemas validate wire format (strings, primitives)
 * - Routers transform wire → domain using these utilities
 * - Services work with clean domain types (Date, etc.)
 */

/**
 * Parse an optional ISO 8601 datetime string to Date object
 *
 * @param iso - ISO 8601 datetime string (e.g., "2025-01-01T12:00:00.000Z")
 * @returns Date object or undefined if input is undefined
 *
 * Note: Assumes Zod has already validated the string format with z.string().datetime()
 */
export function parseOptionalDate(iso?: string): Date | undefined {
  return iso ? new Date(iso) : undefined;
}

/**
 * Parse a required ISO 8601 datetime string to Date object
 *
 * @param iso - ISO 8601 datetime string (e.g., "2025-01-01T12:00:00.000Z")
 * @returns Date object
 *
 * Note: Assumes Zod has already validated the string format with z.string().datetime()
 */
export function parseDate(iso: string): Date {
  return new Date(iso);
}

/**
 * Parse an optional ISO 8601 datetime string to Date object or null
 * (for database fields that use null instead of undefined)
 *
 * @param iso - ISO 8601 datetime string (e.g., "2025-01-01T12:00:00.000Z")
 * @returns Date object or null if input is undefined
 *
 * Note: Assumes Zod has already validated the string format with z.string().datetime()
 */
export function parseOptionalDateOrNull(iso?: string): Date | null {
  return iso ? new Date(iso) : null;
}

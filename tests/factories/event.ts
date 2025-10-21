import type { Event } from "@prisma/client";

/**
 * Build an Event object for testing
 * @param overrides - Partial Event object to override defaults
 * @returns Event object with sensible defaults
 */
export function buildEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "event-test-1",
    name: "97th Academy Awards 2025",
    slug: "oscars-2025",
    description: "The 97th Academy Awards ceremony",
    eventDate: new Date("2025-03-02T20:00:00Z"),
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

import type { Event } from "@prisma/client";

/**
 * Test fixtures for Event model
 * Pre-configured, realistic event data for common test scenarios
 */

/**
 * Oscars 2025 - Future event (OPEN status)
 * picksLockAt is in the future - suitable for testing active games
 */
export const OSCARS_2025_EVENT: Event = {
  id: "event-oscars-2025",
  name: "97th Academy Awards",
  slug: "oscars-2025",
  description:
    "The 97th Academy Awards ceremony, presented by the Academy of Motion Picture Arts and Sciences (AMPAS), will honor films released in 2024.",
  eventDate: new Date("2025-03-02T01:00:00.000Z"), // March 2, 2025 at 8pm ET
  createdAt: new Date("2024-01-15T00:00:00.000Z"),
  updatedAt: new Date("2024-01-15T00:00:00.000Z"),
};

/**
 * Oscars 2024 - Past event (COMPLETED status)
 * Event has concluded - suitable for testing historical data
 */
export const OSCARS_2024_EVENT: Event = {
  id: "event-oscars-2024",
  name: "96th Academy Awards",
  slug: "oscars-2024",
  description:
    "The 96th Academy Awards ceremony, presented by the Academy of Motion Picture Arts and Sciences (AMPAS), honored films released in 2023.",
  eventDate: new Date("2024-03-10T01:00:00.000Z"), // March 10, 2024 at 8pm ET
  createdAt: new Date("2023-01-15T00:00:00.000Z"),
  updatedAt: new Date("2024-03-11T00:00:00.000Z"),
};

/**
 * Grammys 2025 - Setup event
 * Event is being configured - suitable for testing admin workflows
 */
export const GRAMMYS_2025_EVENT: Event = {
  id: "event-grammys-2025",
  name: "67th Annual Grammy Awards",
  slug: "grammys-2025",
  description:
    "The 67th Annual Grammy Awards will recognize the best recordings, compositions, and artists of the eligibility year.",
  eventDate: new Date("2025-02-02T02:00:00.000Z"), // February 2, 2025 at 9pm ET
  createdAt: new Date("2024-11-01T00:00:00.000Z"),
  updatedAt: new Date("2024-11-01T00:00:00.000Z"),
};

/**
 * Emmys 2024 - Recent past event
 * Recently concluded event - suitable for testing leaderboard calculations
 */
export const EMMYS_2024_EVENT: Event = {
  id: "event-emmys-2024",
  name: "76th Primetime Emmy Awards",
  slug: "emmys-2024",
  description:
    "The 76th Primetime Emmy Awards honored the best in American prime time television programming.",
  eventDate: new Date("2024-09-15T00:00:00.000Z"), // September 15, 2024 at 8pm ET
  createdAt: new Date("2024-06-01T00:00:00.000Z"),
  updatedAt: new Date("2024-09-16T00:00:00.000Z"),
};

import type { Category } from "@prisma/client";
import { OSCARS_2025_EVENT, OSCARS_2024_EVENT } from "./events";

/**
 * Test fixtures for Category model
 * Realistic Oscar categories with appropriate point values
 */

/**
 * Best Picture - Highest value category (unrevealed)
 * 10 points - Most prestigious award
 */
export const BEST_PICTURE_CATEGORY: Category = {
  id: "cat-best-picture",
  eventId: OSCARS_2025_EVENT.id,
  name: "Best Picture",
  order: 1,
  points: 10,
  isRevealed: false,
  winnerNominationId: null,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

/**
 * Best Director - High value category (unrevealed)
 * 8 points - Second most prestigious
 */
export const BEST_DIRECTOR_CATEGORY: Category = {
  id: "cat-best-director",
  eventId: OSCARS_2025_EVENT.id,
  name: "Best Director",
  order: 2,
  points: 8,
  isRevealed: false,
  winnerNominationId: null,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

/**
 * Best Actor - Medium-high value (unrevealed)
 * 6 points - Major acting award
 */
export const BEST_ACTOR_CATEGORY: Category = {
  id: "cat-best-actor",
  eventId: OSCARS_2025_EVENT.id,
  name: "Best Actor in a Leading Role",
  order: 3,
  points: 6,
  isRevealed: false,
  winnerNominationId: null,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

/**
 * Best Actress - Medium-high value (unrevealed)
 * 6 points - Major acting award
 */
export const BEST_ACTRESS_CATEGORY: Category = {
  id: "cat-best-actress",
  eventId: OSCARS_2025_EVENT.id,
  name: "Best Actress in a Leading Role",
  order: 4,
  points: 6,
  isRevealed: false,
  winnerNominationId: null,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

/**
 * Best Supporting Actor - Medium value (unrevealed)
 * 4 points - Supporting role award
 */
export const BEST_SUPPORTING_ACTOR_CATEGORY: Category = {
  id: "cat-best-supporting-actor",
  eventId: OSCARS_2025_EVENT.id,
  name: "Best Actor in a Supporting Role",
  order: 5,
  points: 4,
  isRevealed: false,
  winnerNominationId: null,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

/**
 * Best Cinematography - Lower value technical (unrevealed)
 * 2 points - Technical award
 */
export const BEST_CINEMATOGRAPHY_CATEGORY: Category = {
  id: "cat-best-cinematography",
  eventId: OSCARS_2025_EVENT.id,
  name: "Best Cinematography",
  order: 10,
  points: 2,
  isRevealed: false,
  winnerNominationId: null,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

/**
 * Best Original Screenplay - Medium value writing (unrevealed)
 * 5 points - Writing award
 */
export const BEST_ORIGINAL_SCREENPLAY_CATEGORY: Category = {
  id: "cat-best-original-screenplay",
  eventId: OSCARS_2025_EVENT.id,
  name: "Best Original Screenplay",
  order: 6,
  points: 5,
  isRevealed: false,
  winnerNominationId: null,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

/**
 * Best Animated Feature - Medium value (unrevealed)
 * 4 points - Genre-specific award
 */
export const BEST_ANIMATED_FEATURE_CATEGORY: Category = {
  id: "cat-best-animated-feature",
  eventId: OSCARS_2025_EVENT.id,
  name: "Best Animated Feature Film",
  order: 15,
  points: 4,
  isRevealed: false,
  winnerNominationId: null,
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
};

/**
 * Revealed Best Picture 2024 - COMPLETED category with winner
 * 10 points - Winner has been announced
 */
export const REVEALED_BEST_PICTURE_2024: Category = {
  id: "cat-revealed-best-picture-2024",
  eventId: OSCARS_2024_EVENT.id,
  name: "Best Picture",
  order: 1,
  points: 10,
  isRevealed: true,
  winnerNominationId: "nom-oppenheimer-best-picture", // Oppenheimer won
  createdAt: new Date("2023-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-03-10T04:30:00.000Z"), // Updated when winner revealed
};

/**
 * Revealed Best Actor 2024 - COMPLETED category with winner
 * 6 points - Cillian Murphy won for Oppenheimer
 */
export const REVEALED_BEST_ACTOR_2024: Category = {
  id: "cat-revealed-best-actor-2024",
  eventId: OSCARS_2024_EVENT.id,
  name: "Best Actor in a Leading Role",
  order: 3,
  points: 6,
  isRevealed: true,
  winnerNominationId: "nom-cillian-murphy-best-actor",
  createdAt: new Date("2023-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-03-10T03:45:00.000Z"),
};

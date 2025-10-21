import type { Category } from "@prisma/client";
import { OSCARS_2024_EVENT, OSCARS_2025_EVENT } from "./events";

/**
 * Test fixtures for Category model
 * Realistic Oscar categories with appropriate point values
 */

/**
 * Best Picture - Highest value category (unrevealed)
 * 10 points - Most prestigious award
 */
export const BEST_PICTURE_CATEGORY: Category = {
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  eventId: OSCARS_2025_EVENT.id,
  id: "cat-best-picture",
  isRevealed: false,
  name: "Best Picture",
  order: 1,
  points: 10,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  winnerNominationId: null,
};

/**
 * Best Director - High value category (unrevealed)
 * 8 points - Second most prestigious
 */
export const BEST_DIRECTOR_CATEGORY: Category = {
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  eventId: OSCARS_2025_EVENT.id,
  id: "cat-best-director",
  isRevealed: false,
  name: "Best Director",
  order: 2,
  points: 8,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  winnerNominationId: null,
};

/**
 * Best Actor - Medium-high value (unrevealed)
 * 6 points - Major acting award
 */
export const BEST_ACTOR_CATEGORY: Category = {
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  eventId: OSCARS_2025_EVENT.id,
  id: "cat-best-actor",
  isRevealed: false,
  name: "Best Actor in a Leading Role",
  order: 3,
  points: 6,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  winnerNominationId: null,
};

/**
 * Best Actress - Medium-high value (unrevealed)
 * 6 points - Major acting award
 */
export const BEST_ACTRESS_CATEGORY: Category = {
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  eventId: OSCARS_2025_EVENT.id,
  id: "cat-best-actress",
  isRevealed: false,
  name: "Best Actress in a Leading Role",
  order: 4,
  points: 6,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  winnerNominationId: null,
};

/**
 * Best Supporting Actor - Medium value (unrevealed)
 * 4 points - Supporting role award
 */
export const BEST_SUPPORTING_ACTOR_CATEGORY: Category = {
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  eventId: OSCARS_2025_EVENT.id,
  id: "cat-best-supporting-actor",
  isRevealed: false,
  name: "Best Actor in a Supporting Role",
  order: 5,
  points: 4,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  winnerNominationId: null,
};

/**
 * Best Cinematography - Lower value technical (unrevealed)
 * 2 points - Technical award
 */
export const BEST_CINEMATOGRAPHY_CATEGORY: Category = {
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  eventId: OSCARS_2025_EVENT.id,
  id: "cat-best-cinematography",
  isRevealed: false,
  name: "Best Cinematography",
  order: 10,
  points: 2,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  winnerNominationId: null,
};

/**
 * Best Original Screenplay - Medium value writing (unrevealed)
 * 5 points - Writing award
 */
export const BEST_ORIGINAL_SCREENPLAY_CATEGORY: Category = {
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  eventId: OSCARS_2025_EVENT.id,
  id: "cat-best-original-screenplay",
  isRevealed: false,
  name: "Best Original Screenplay",
  order: 6,
  points: 5,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  winnerNominationId: null,
};

/**
 * Best Animated Feature - Medium value (unrevealed)
 * 4 points - Genre-specific award
 */
export const BEST_ANIMATED_FEATURE_CATEGORY: Category = {
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  eventId: OSCARS_2025_EVENT.id,
  id: "cat-best-animated-feature",
  isRevealed: false,
  name: "Best Animated Feature Film",
  order: 15,
  points: 4,
  updatedAt: new Date("2024-12-15T00:00:00.000Z"),
  winnerNominationId: null,
};

/**
 * Revealed Best Picture 2024 - COMPLETED category with winner
 * 10 points - Winner has been announced
 */
export const REVEALED_BEST_PICTURE_2024: Category = {
  createdAt: new Date("2023-12-15T00:00:00.000Z"),
  eventId: OSCARS_2024_EVENT.id,
  id: "cat-revealed-best-picture-2024",
  isRevealed: true,
  name: "Best Picture",
  order: 1,
  points: 10,
  updatedAt: new Date("2024-03-10T04:30:00.000Z"), // Updated when winner revealed
  winnerNominationId: "nom-oppenheimer-best-picture", // Oppenheimer won
};

/**
 * Revealed Best Actor 2024 - COMPLETED category with winner
 * 6 points - Cillian Murphy won for Oppenheimer
 */
export const REVEALED_BEST_ACTOR_2024: Category = {
  createdAt: new Date("2023-12-15T00:00:00.000Z"),
  eventId: OSCARS_2024_EVENT.id,
  id: "cat-revealed-best-actor-2024",
  isRevealed: true,
  name: "Best Actor in a Leading Role",
  order: 3,
  points: 6,
  updatedAt: new Date("2024-03-10T03:45:00.000Z"),
  winnerNominationId: "nom-cillian-murphy-best-actor",
};

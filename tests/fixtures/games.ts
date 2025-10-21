import { type Game, GameStatus } from "@prisma/client";
import { GRAMMYS_2025_EVENT, OSCARS_2024_EVENT, OSCARS_2025_EVENT } from "./events";

/**
 * Test fixtures for Game model
 * Pre-configured games covering all GameStatus values
 */

/**
 * SETUP Game - Configuration in progress
 * Game is being set up by admin, not yet ready for picks
 */
export const SETUP_GAME_FIXTURE: Game = {
  accessCode: "GRAMMYS25",
  createdAt: new Date("2024-11-01T10:00:00.000Z"),
  eventId: GRAMMYS_2025_EVENT.id,
  id: "game-setup-001",
  name: "Friends Grammy Party 2025",
  picksLockAt: null,
  status: GameStatus.SETUP,
  updatedAt: new Date("2024-11-01T10:00:00.000Z"),
};

/**
 * OPEN Game - Accepting picks
 * Game is ready for users to join and submit picks
 * picksLockAt is in the future
 */
export const OPEN_GAME_FIXTURE: Game = {
  accessCode: "OSCARS2025",
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  eventId: OSCARS_2025_EVENT.id,
  id: "game-open-001",
  name: "Oscar Predictions 2025",
  picksLockAt: new Date("2025-03-02T00:00:00.000Z"), // 1 hour before ceremony
  status: GameStatus.OPEN,
  updatedAt: new Date("2024-12-20T00:00:00.000Z"),
};

/**
 * LIVE Game - Ceremony in progress
 * Picks are locked, winners being revealed
 * picksLockAt is in the past, event date is now
 */
export const LIVE_GAME_FIXTURE: Game = {
  accessCode: "LIVE2024",
  createdAt: new Date("2024-01-10T00:00:00.000Z"),
  eventId: OSCARS_2024_EVENT.id,
  id: "game-live-001",
  name: "Live Oscar Night 2024",
  picksLockAt: new Date("2024-03-10T00:00:00.000Z"), // 1 hour before ceremony
  status: GameStatus.LIVE,
  updatedAt: new Date("2024-03-10T01:00:00.000Z"),
};

/**
 * COMPLETED Game - Event concluded
 * All winners revealed, final leaderboard available
 */
export const COMPLETED_GAME_FIXTURE: Game = {
  accessCode: "FINAL2024",
  createdAt: new Date("2024-01-05T00:00:00.000Z"),
  eventId: OSCARS_2024_EVENT.id,
  id: "game-completed-001",
  name: "Oscars 2024 Final Results",
  picksLockAt: new Date("2024-03-10T00:00:00.000Z"),
  status: GameStatus.COMPLETED,
  updatedAt: new Date("2024-03-11T05:00:00.000Z"), // Updated after ceremony
};

/**
 * Public OPEN Game - Large public game
 * Suitable for testing performance with many participants
 */
export const PUBLIC_OPEN_GAME_FIXTURE: Game = {
  accessCode: "PUBLIC25",
  createdAt: new Date("2024-11-01T00:00:00.000Z"),
  eventId: OSCARS_2025_EVENT.id,
  id: "game-public-001",
  name: "Public Oscars Pool 2025",
  picksLockAt: new Date("2025-03-02T00:00:00.000Z"),
  status: GameStatus.OPEN,
  updatedAt: new Date("2025-01-15T00:00:00.000Z"),
};

/**
 * Private OPEN Game - Small private game
 * Suitable for testing friend group scenarios
 */
export const PRIVATE_OPEN_GAME_FIXTURE: Game = {
  accessCode: "SMITHS25",
  createdAt: new Date("2024-12-20T00:00:00.000Z"),
  eventId: OSCARS_2025_EVENT.id,
  id: "game-private-001",
  name: "Smith Family Oscars",
  picksLockAt: new Date("2025-03-02T00:00:00.000Z"),
  status: GameStatus.OPEN,
  updatedAt: new Date("2024-12-20T00:00:00.000Z"),
};

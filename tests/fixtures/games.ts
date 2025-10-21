import { GameStatus, type Game } from "@prisma/client";
import { OSCARS_2025_EVENT, OSCARS_2024_EVENT, GRAMMYS_2025_EVENT } from "./events";

/**
 * Test fixtures for Game model
 * Pre-configured games covering all GameStatus values
 */

/**
 * SETUP Game - Configuration in progress
 * Game is being set up by admin, not yet ready for picks
 */
export const SETUP_GAME_FIXTURE: Game = {
  id: "game-setup-001",
  eventId: GRAMMYS_2025_EVENT.id,
  name: "Friends Grammy Party 2025",
  accessCode: "GRAMMYS25",
  status: GameStatus.SETUP,
  picksLockAt: null,
  createdAt: new Date("2024-11-01T10:00:00.000Z"),
  updatedAt: new Date("2024-11-01T10:00:00.000Z"),
};

/**
 * OPEN Game - Accepting picks
 * Game is ready for users to join and submit picks
 * picksLockAt is in the future
 */
export const OPEN_GAME_FIXTURE: Game = {
  id: "game-open-001",
  eventId: OSCARS_2025_EVENT.id,
  name: "Oscar Predictions 2025",
  accessCode: "OSCARS2025",
  status: GameStatus.OPEN,
  picksLockAt: new Date("2025-03-02T00:00:00.000Z"), // 1 hour before ceremony
  createdAt: new Date("2024-12-15T00:00:00.000Z"),
  updatedAt: new Date("2024-12-20T00:00:00.000Z"),
};

/**
 * LIVE Game - Ceremony in progress
 * Picks are locked, winners being revealed
 * picksLockAt is in the past, event date is now
 */
export const LIVE_GAME_FIXTURE: Game = {
  id: "game-live-001",
  eventId: OSCARS_2024_EVENT.id,
  name: "Live Oscar Night 2024",
  accessCode: "LIVE2024",
  status: GameStatus.LIVE,
  picksLockAt: new Date("2024-03-10T00:00:00.000Z"), // 1 hour before ceremony
  createdAt: new Date("2024-01-10T00:00:00.000Z"),
  updatedAt: new Date("2024-03-10T01:00:00.000Z"),
};

/**
 * COMPLETED Game - Event concluded
 * All winners revealed, final leaderboard available
 */
export const COMPLETED_GAME_FIXTURE: Game = {
  id: "game-completed-001",
  eventId: OSCARS_2024_EVENT.id,
  name: "Oscars 2024 Final Results",
  accessCode: "FINAL2024",
  status: GameStatus.COMPLETED,
  picksLockAt: new Date("2024-03-10T00:00:00.000Z"),
  createdAt: new Date("2024-01-05T00:00:00.000Z"),
  updatedAt: new Date("2024-03-11T05:00:00.000Z"), // Updated after ceremony
};

/**
 * Public OPEN Game - Large public game
 * Suitable for testing performance with many participants
 */
export const PUBLIC_OPEN_GAME_FIXTURE: Game = {
  id: "game-public-001",
  eventId: OSCARS_2025_EVENT.id,
  name: "Public Oscars Pool 2025",
  accessCode: "PUBLIC25",
  status: GameStatus.OPEN,
  picksLockAt: new Date("2025-03-02T00:00:00.000Z"),
  createdAt: new Date("2024-11-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-15T00:00:00.000Z"),
};

/**
 * Private OPEN Game - Small private game
 * Suitable for testing friend group scenarios
 */
export const PRIVATE_OPEN_GAME_FIXTURE: Game = {
  id: "game-private-001",
  eventId: OSCARS_2025_EVENT.id,
  name: "Smith Family Oscars",
  accessCode: "SMITHS25",
  status: GameStatus.OPEN,
  picksLockAt: new Date("2025-03-02T00:00:00.000Z"),
  createdAt: new Date("2024-12-20T00:00:00.000Z"),
  updatedAt: new Date("2024-12-20T00:00:00.000Z"),
};

import type { GameStatus } from "@prisma/client";
import { expect } from "vitest";

/**
 * Helper for cleaner async error assertions
 * Improves readability over expect().rejects.toThrow()
 *
 * @example
 * await expectToThrow(
 *   () => pickService.submitPick(userId, data),
 *   'Picks are closed'
 * );
 */
export async function expectToThrow(fn: () => Promise<any>, errorMessage?: string | RegExp) {
  if (errorMessage) {
    await expect(fn()).rejects.toThrow(errorMessage);
  } else {
    await expect(fn()).rejects.toThrow();
  }
}

/**
 * Helper for timing-dependent tests that need to wait for database writes
 * Uses a small delay to ensure async operations complete
 *
 * @example
 * await pickModel.create(data);
 * await waitForDbWrite();
 * const result = await pickModel.findById(id);
 */
export async function waitForDbWrite(ms = 10) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Custom matcher to verify a game has a specific status
 * Provides better error messages than toBe()
 *
 * @example
 * expect(game).toMatchGameStatus('OPEN');
 */
export function toMatchGameStatus(received: { status: GameStatus }, expected: GameStatus) {
  const pass = received.status === expected;
  return {
    message: () =>
      pass
        ? `Expected game status NOT to be ${expected}, but it was`
        : `Expected game status to be ${expected}, but received ${received.status}`,
    pass,
  };
}

/**
 * Custom matcher to verify a pick object has required fields
 * Validates structure without checking specific values
 *
 * @example
 * expect(pick).toBeValidPick();
 */
export function toBeValidPick(received: any) {
  const requiredFields = ["id", "gameId", "userId", "categoryId", "nominationId"];
  const missingFields = requiredFields.filter((field) => !(field in received));

  const pass = missingFields.length === 0;
  return {
    message: () =>
      pass
        ? "Expected object NOT to be a valid pick, but it was"
        : `Expected object to be a valid pick, but missing fields: ${missingFields.join(", ")}`,
    pass,
  };
}

/**
 * Custom matcher to verify a game has required fields
 * Validates structure without checking specific values
 *
 * @example
 * expect(game).toBeValidGame();
 */
export function toBeValidGame(received: any) {
  const requiredFields = [
    "id",
    "name",
    "eventId",
    "accessCode",
    "status",
    "createdAt",
    "updatedAt",
  ];
  const missingFields = requiredFields.filter((field) => !(field in received));

  const pass = missingFields.length === 0;
  return {
    message: () =>
      pass
        ? "Expected object NOT to be a valid game, but it was"
        : `Expected object to be a valid game, but missing fields: ${missingFields.join(", ")}`,
    pass,
  };
}

/**
 * Register custom matchers with Vitest
 * Call this in your test setup file
 *
 * @example
 * // In vitest.config.ts or setup file
 * import { registerCustomMatchers } from '@/tests/utils/test-helpers';
 * registerCustomMatchers();
 */
export function registerCustomMatchers() {
  expect.extend({
    toBeValidGame,
    toBeValidPick,
    toMatchGameStatus,
  });
}

// TypeScript augmentation for custom matchers
declare module "vitest" {
  interface Assertion {
    toMatchGameStatus(expected: GameStatus): void;
    toBeValidPick(): void;
    toBeValidGame(): void;
  }
}

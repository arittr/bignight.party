import { vi } from "vitest";
import type { Game, Pick, GameParticipant } from "@prisma/client";

/**
 * Creates a mocked game model with all functions as vi.fn()
 * Returns object matching the structure of src/lib/models/game.ts
 *
 * @example
 * const gameModel = mockGameModel();
 * gameModel.findById.mockResolvedValue(buildGame({ id: 'game-1' }));
 */
export function mockGameModel() {
  return {
    create: vi.fn<() => Promise<Game>>(),
    findAll: vi.fn<() => Promise<Game[]>>(),
    findById: vi.fn<() => Promise<Game | null>>(),
    findByEventId: vi.fn<() => Promise<Game[]>>(),
    findByAccessCode: vi.fn<() => Promise<Game | null>>(),
    update: vi.fn<() => Promise<Game>>(),
    deleteById: vi.fn<() => Promise<Game>>(),
  };
}

/**
 * Creates a mocked pick model with all functions as vi.fn()
 * Returns object matching the structure of src/lib/models/pick.ts
 *
 * @example
 * const pickModel = mockPickModel();
 * pickModel.upsert.mockResolvedValue(buildPick({ id: 'pick-1' }));
 */
export function mockPickModel() {
  return {
    create: vi.fn<() => Promise<Pick>>(),
    findAll: vi.fn<() => Promise<Pick[]>>(),
    findById: vi.fn<() => Promise<Pick | null>>(),
    findByGameId: vi.fn<() => Promise<Pick[]>>(),
    findByUserId: vi.fn<() => Promise<Pick[]>>(),
    deleteById: vi.fn<() => Promise<Pick>>(),
    upsert: vi.fn<() => Promise<Pick>>(),
    getPicksByGameAndUser: vi.fn<() => Promise<Pick[]>>(),
    getPicksCountByGameAndUser: vi.fn<() => Promise<number>>(),
    deleteByUserAndGame: vi.fn<() => Promise<any>>(),
  };
}

/**
 * Creates a mocked game participant model with all functions as vi.fn()
 * Returns object matching the structure of src/lib/models/game-participant.ts
 *
 * @example
 * const participantModel = mockGameParticipantModel();
 * participantModel.exists.mockResolvedValue(true);
 */
export function mockGameParticipantModel() {
  return {
    create: vi.fn<() => Promise<GameParticipant>>(),
    findByUserId: vi.fn<() => Promise<GameParticipant[]>>(),
    findByGameId: vi.fn<() => Promise<GameParticipant[]>>(),
    exists: vi.fn<() => Promise<boolean>>(),
    deleteByUserAndGame: vi.fn<() => Promise<GameParticipant>>(),
  };
}

/**
 * Helper for mocking next-safe-action server actions
 * Wraps a mock function to match the action response structure
 *
 * @example
 * const mockSubmitPick = mockServerAction();
 * mockSubmitPick.mockResolvedValue({ data: { success: true } });
 *
 * // In test
 * vi.mock('@/lib/actions/pick-actions', () => ({
 *   submitPickAction: mockServerAction(),
 * }));
 */
export function mockServerAction<TData = any>() {
  return vi.fn<
    () => Promise<{
      data?: TData;
      serverError?: string;
      validationErrors?: Record<string, string[]>;
    }>
  >();
}

/**
 * Resets all mocks to their initial state
 * Convenience function to call in beforeEach or afterEach
 *
 * @example
 * beforeEach(() => {
 *   resetAllMocks();
 * });
 */
export function resetAllMocks() {
  vi.clearAllMocks();
  vi.resetAllMocks();
}

/**
 * Test Factories
 *
 * Factory functions for creating test data with sensible defaults.
 * Each factory accepts a Partial<Model> to override specific fields.
 *
 * Usage:
 * ```typescript
 * import { buildGame, buildUser, buildPick } from 'tests/factories'
 *
 * // Use with defaults
 * const game = buildGame()
 *
 * // Override specific fields
 * const openGame = buildGame({ status: 'OPEN' })
 * const adminUser = buildUser({ role: 'ADMIN', email: 'admin@example.com' })
 * ```
 */

export { buildUser } from "./user";
export { buildEvent } from "./event";
export { buildGame } from "./game";
export { buildCategory } from "./category";
export { buildNomination } from "./nomination";
export { buildPick } from "./pick";

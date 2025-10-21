import type { Role, User } from "@prisma/client";

/**
 * Build a User object for testing
 * @param overrides - Partial User object to override defaults
 * @returns User object with sensible defaults
 */
export function buildUser(overrides: Partial<User> = {}): User {
  return {
    createdAt: new Date("2025-01-01T00:00:00Z"),
    email: "test@example.com",
    emailVerified: null,
    id: "user-test-1",
    image: null,
    name: "Test User",
    role: "USER" as Role,
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

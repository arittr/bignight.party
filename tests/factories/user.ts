import type { User, Role } from "@prisma/client";

/**
 * Build a User object for testing
 * @param overrides - Partial User object to override defaults
 * @returns User object with sensible defaults
 */
export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-test-1",
    email: "test@example.com",
    role: "USER" as Role,
    emailVerified: null,
    name: "Test User",
    image: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

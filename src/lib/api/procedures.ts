import { os } from "@orpc/server";
import { requireValidatedSessionOrThrow } from "@/lib/auth/config";

/**
 * Public procedure - No authentication required.
 * Use for publicly accessible endpoints like sign-in, sign-up.
 */
export const publicProcedure = os;

/**
 * Authentication middleware.
 * Validates JWT AND user exists in database (protects against stale JWTs).
 * Provides user context (userId, userRole, userEmail).
 */
export const authMiddleware = os.middleware(async ({ next }) => {
  const session = await requireValidatedSessionOrThrow();

  return next({
    context: {
      userId: session.user.id,
      userRole: session.user.role,
      userEmail: session.user.email ?? undefined,
    },
  });
});

/**
 * Admin middleware.
 * Validates session, checks user exists in database, and verifies ADMIN role.
 */
export const adminMiddleware = os.middleware(async ({ next }) => {
  const session = await requireValidatedSessionOrThrow();

  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: This action requires admin privileges");
  }

  return next({
    context: {
      userId: session.user.id,
      userRole: session.user.role,
      userEmail: session.user.email ?? undefined,
    },
  });
});

/**
 * Authenticated procedure - Requires valid session.
 * Validates JWT AND user exists in database (protects against stale JWTs).
 * Provides user context (userId, userRole, userEmail).
 */
export const authenticatedProcedure = publicProcedure.use(authMiddleware);

/**
 * Admin procedure - Requires ADMIN role.
 * Validates session, checks user exists in database, and verifies ADMIN role.
 */
export const adminProcedure = publicProcedure.use(adminMiddleware);

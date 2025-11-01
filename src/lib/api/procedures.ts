import { os } from "@orpc/server";
import { requireValidatedSessionOrThrow } from "@/lib/auth/config";

/**
 * Context type for all procedures.
 * Contains user information from authentication middleware.
 */
export type Context = {
  userId?: string;
  userRole?: string;
  userEmail?: string;
};

/**
 * Public procedure - No authentication required.
 * Use for publicly accessible endpoints like sign-in, sign-up.
 */
export const publicProcedure = os;

/**
 * Authenticated procedure - Requires valid session.
 * Validates JWT AND user exists in database (protects against stale JWTs).
 * Provides user context (userId, userRole, userEmail).
 */
export const authenticatedProcedure = publicProcedure.use(async ({ context, next }) => {
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
 * Admin procedure - Requires ADMIN role.
 * Validates session, checks user exists in database, and verifies ADMIN role.
 */
export const adminProcedure = publicProcedure.use(async ({ context, next }) => {
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

import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/lib/auth/config";

// Base action client - no authentication required
export const action = createSafeActionClient();

// Authenticated action client - requires valid session
export const authenticatedAction = createSafeActionClient().use(async ({ next }) => {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in to perform this action");
  }

  return next({
    ctx: {
      userId: session.user.id,
      userRole: session.user.role,
    },
  });
});

// Admin action client - requires ADMIN role
export const adminAction = createSafeActionClient().use(async ({ next }) => {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: You must be logged in to perform this action");
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: This action requires admin privileges");
  }

  return next({
    ctx: {
      userId: session.user.id,
    },
  });
});

import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";
import { gameRouter } from "./routers/game";
import { pickRouter } from "./routers/pick";

/**
 * Root router - combines all domain routers.
 *
 * Note: All procedures are nested under domain routers to ensure
 * proper type inference with TanStack Query integration.
 */
export const appRouter = {
  auth: authRouter,
  admin: adminRouter,
  game: gameRouter,
  pick: pickRouter,
};

/**
 * Export router type for type-safe clients
 */
export type AppRouter = typeof appRouter;

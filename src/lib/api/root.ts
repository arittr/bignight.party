import { publicProcedure } from "./procedures";
import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";
import { gameRouter } from "./routers/game";
import { pickRouter } from "./routers/pick";

/**
 * Root router - combines all domain routers.
 */
export const appRouter = {
  health: publicProcedure.handler(() => {
    return { status: "ok" };
  }),
  auth: authRouter,
  admin: adminRouter,
  game: gameRouter,
  pick: pickRouter,
};

/**
 * Export router type for type-safe clients
 */
export type AppRouter = typeof appRouter;

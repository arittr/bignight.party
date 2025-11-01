import { publicProcedure } from "./procedures";
import { adminRouter } from "./routers/admin";

/**
 * Root router - combines all domain routers.
 */
export const appRouter = {
  health: publicProcedure.handler(() => {
    return { status: "ok" };
  }),
  admin: adminRouter,
};

/**
 * Export router type for type-safe clients
 */
export type AppRouter = typeof appRouter;

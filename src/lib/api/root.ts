import { publicProcedure } from "./procedures";

/**
 * Root router - combines all domain routers.
 * This is a placeholder that will be expanded as domain routers are added.
 */
export const appRouter = {
  health: publicProcedure.handler(() => {
    return { status: "ok" };
  }),
};

/**
 * Export router type for type-safe clients
 */
export type AppRouter = typeof appRouter;

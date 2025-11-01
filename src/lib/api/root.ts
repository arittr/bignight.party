import { publicProcedure } from "./procedures";
import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";

/**
 * Root router - combines all domain routers.
 */
export const appRouter = {
  health: publicProcedure.handler(() => {
    return { status: "ok" };
  }),
  auth: authRouter,
  admin: adminRouter,
};

/**
 * Export router type for type-safe clients
 */
export type AppRouter = typeof appRouter;

import { createRouterClient } from "@orpc/server";
import type { ClientContext } from "@orpc/client";
import type { AppRouter } from "./root";
import { appRouter } from "./root";

/**
 * Server-side client for calling oRPC procedures directly (no HTTP).
 *
 * Use this in React Server Components to call procedures without HTTP overhead.
 * This provides type-safe access to all procedures with direct function calls.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { serverClient } from "@/lib/api/server-client";
 *
 * export default async function DashboardPage() {
 *   const games = await serverClient.game.list();
 *   return <GameList games={games} />;
 * }
 * ```
 */
export const serverClient = createRouterClient<AppRouter, ClientContext>(appRouter);

"use client";

import { createORPCClient } from "@orpc/client";
import type { ClientContext } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouter } from "./root";

/**
 * HTTP client for calling oRPC procedures from Client Components.
 *
 * This client makes HTTP requests to the API route handler.
 * Use this in Client Components for mutations and queries.
 *
 * @example
 * ```tsx
 * "use client";
 * import { orpc } from "@/lib/api/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * export function JoinGameButton({ code }: { code: string }) {
 *   const mutation = useMutation(
 *     orpc.game.join.mutationOptions()
 *   );
 *
 *   return (
 *     <button onClick={() => mutation.mutate({ code })}>
 *       Join Game
 *     </button>
 *   );
 * }
 * ```
 */
// Construct absolute URL for oRPC endpoint
// In browser: use window.location.origin
// In SSR: use NEXTAUTH_URL or localhost default
const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  return "http://localhost:3000";
};

// Create RPCLink with Next.js headers integration for SSR
const link = new RPCLink({
  url: `${getBaseUrl()}/api/rpc`,
  headers: async () => {
    // In browser, no headers needed (cookies sent automatically)
    if (typeof window !== "undefined") return {};

    // In SSR, include Next.js headers for auth context
    const { headers } = await import("next/headers");
    return await headers();
  },
});

// Create base client with proper type - RouterClient converts router type to client type
const baseClient = createORPCClient<RouterClient<AppRouter, ClientContext>>(link);

// Create TanStack Query utilities - provides .mutationOptions() and .queryOptions()
// Type is inferred from baseClient, no need for explicit type parameter
export const orpc = createTanstackQueryUtils(baseClient);

// Alias for clarity - use 'api' to call oRPC procedures
export const api = orpc;

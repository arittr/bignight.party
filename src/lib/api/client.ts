"use client";

import { createORPCClient } from "@orpc/client";
import { LinkFetchClient } from "@orpc/client/fetch";
import { StandardRPCLink } from "@orpc/client/standard";
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
 *
 * export function JoinGameButton({ code }: { code: string }) {
 *   const mutation = orpc.game.join.useMutation();
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

const fetchClient = new LinkFetchClient({});
const link = new StandardRPCLink(fetchClient, {
  url: `${getBaseUrl()}/api/rpc`,
});

// Type assertion needed because oRPC infers types at runtime
// The server-side client will provide proper type safety
export const orpc = createORPCClient(link) as any as AppRouter;

// Alias for clarity - use 'api' to call oRPC procedures
export const api = orpc;

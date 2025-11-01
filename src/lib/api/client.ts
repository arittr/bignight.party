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
const fetchClient = new LinkFetchClient({});
const link = new StandardRPCLink(fetchClient, {
  url: "/api/rpc",
});

// Type assertion needed because oRPC infers types at runtime
// The server-side client will provide proper type safety
export const orpc = createORPCClient(link) as any as AppRouter;

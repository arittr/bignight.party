import { RPCHandler } from "@orpc/server/fetch";
import { appRouter } from "@/lib/api/root";

/**
 * Next.js API route handler for oRPC procedures.
 *
 * Uses @orpc/server/fetch with RPCHandler, which is the recommended adapter
 * for Next.js 15 App Router (route handlers). This provides native fetch API
 * integration and works seamlessly with Next.js Route Handlers.
 *
 * Note: @orpc/next is for Pages Router only. App Router uses @orpc/server/fetch.
 *
 * Handles requests to /api/rpc/* and routes them to appropriate procedures.
 * Automatically handles batching, error responses, and type inference.
 *
 * @see https://orpc.unnoq.com/docs/adapters/next
 */
const handler = new RPCHandler(appRouter);

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: "/api/rpc",
    context: {},
  });

  return response ?? new Response("Not found", { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;

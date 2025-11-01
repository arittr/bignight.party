import { RPCHandler } from "@orpc/server/fetch";
import { appRouter } from "@/lib/api/root";

/**
 * Next.js API route handler for oRPC procedures.
 *
 * Handles POST requests to /api/rpc/* and routes them to appropriate procedures.
 * Automatically handles batching, error responses, and type inference.
 */
const handler = new RPCHandler(appRouter);

export const POST = handler.handle;

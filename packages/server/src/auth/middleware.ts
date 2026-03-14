import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../env";
import { verifyToken } from "./token";

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = authHeader.slice(7);
  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("playerId", payload.playerId);
  c.set("isAdmin", payload.isAdmin);
  await next();
};

export const adminMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const isAdmin = c.get("isAdmin");
  if (!isAdmin) {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
};

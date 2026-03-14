import { Hono } from "hono";
import type { Db } from "./db/connection";
import type { AppEnv } from "./env";

export function createApp(_db: Db) {
  const app = new Hono<AppEnv>();

  app.get("/health", (c) => c.json({ ok: true }));

  return app;
}

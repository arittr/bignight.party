import { Hono } from "hono";
import { cors } from "hono/cors";
import { playerRoutes } from "./routes/player";
import { picksRoutes } from "./routes/picks";
import { categoriesRoutes } from "./routes/categories";
import { gameRoutes } from "./routes/game";
import { adminRoutes } from "./routes/admin";
import type { Db } from "./db/connection";
import type { AppEnv } from "./env";

export function createApp(db: Db) {
	const app = new Hono<AppEnv>();
	app.use("/*", cors());
	app.route("/api/player", playerRoutes(db));
	app.route("/api/picks", picksRoutes(db));
	app.route("/api/categories", categoriesRoutes(db));
	app.route("/api/game", gameRoutes(db));
	app.route("/api/admin", adminRoutes(db));
	app.get("/api/health", (c) => c.json({ ok: true }));
	return app;
}

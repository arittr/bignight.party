import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { join } from "node:path";
import { playerRoutes } from "./routes/player";
import { picksRoutes } from "./routes/picks";
import { categoriesRoutes } from "./routes/categories";
import { gameRoutes } from "./routes/game";
import { adminRoutes } from "./routes/admin";
import type { Db } from "./db/connection";
import type { AppEnv } from "./env";

const webDistPath = join(import.meta.dir, "../../web/dist");

export function createApp(db: Db) {
	const app = new Hono<AppEnv>();
	app.use("/*", cors());
	app.route("/api/player", playerRoutes(db));
	app.route("/api/picks", picksRoutes(db));
	app.route("/api/categories", categoriesRoutes(db));
	app.route("/api/game", gameRoutes(db));
	app.route("/api/admin", adminRoutes(db));
	app.get("/api/health", (c) => c.json({ ok: true }));

	// Serve static assets from the Vite build output
	app.use("/*", serveStatic({ root: webDistPath }));

	// SPA fallback: serve index.html for any non-API route not matched above
	app.get("*", async (c) => {
		const indexFile = Bun.file(join(webDistPath, "index.html"));
		return new Response(indexFile, {
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	});

	return app;
}

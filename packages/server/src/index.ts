import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";
import { serveStatic } from "hono/bun";
import { join } from "node:path";
import { createDb } from "./db/connection";
import { createApp } from "./app";
import { configureSocketServer } from "./websocket/server";

const db = createDb();
const app = createApp(db);

// Static file serving — only when the build directory exists (production).
// In dev mode, Vite serves the frontend on :5173 and proxies /api to :3000.
const webDistPath = join(import.meta.dir, "../../web/dist");
const indexPath = join(webDistPath, "index.html");
const distExists = await Bun.file(indexPath).exists();

if (distExists) {
	app.use("/*", serveStatic({ root: webDistPath }));
	app.get("*", async () => {
		return new Response(Bun.file(indexPath), {
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	});
}

// Bun-native engine: Socket.io binds to the bun-engine instead of a Node http.Server
const engine = new Engine({ path: "/socket.io/" });
const io = new Server();
io.bind(engine);
configureSocketServer(io, db);

// Clean shutdown on SIGINT/SIGTERM — prevents orphan processes with bun --watch
function shutdown() {
	io.close();
	process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Bun server entrypoint with WebSocket support
export default {
  port: Number(process.env.PORT ?? 3000),
  fetch(req: Request, server: unknown) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/socket.io/")) {
      return engine.handleRequest(req, server as Parameters<typeof engine.handleRequest>[1]);
    }
    return app.fetch(req, server);
  },
  websocket: engine.handler().websocket,
};

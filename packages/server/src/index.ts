import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";
import { serveStatic } from "hono/bun";
import { join } from "node:path";
import { createDb } from "./db/connection";
import { createApp } from "./app";
import { configureSocketServer } from "./websocket/server";

const db = createDb();
const app = createApp(db);

// Static file serving (production only — runs under Bun, not in vitest)
const webDistPath = join(import.meta.dir, "../../web/dist");
app.use("/*", serveStatic({ root: webDistPath }));
app.get("*", async () => {
	const indexFile = Bun.file(join(webDistPath, "index.html"));
	return new Response(indexFile, {
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
});

// Bun-native engine: Socket.io binds to the bun-engine instead of a Node http.Server
const engine = new Engine({ path: "/socket.io/" });
const io = new Server();
io.bind(engine);
configureSocketServer(io);

// Production entrypoint: Bun's native server with WebSocket support
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

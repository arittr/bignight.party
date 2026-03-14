import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { AppEnv } from "../../env";
import { authMiddleware, adminMiddleware } from "../middleware";
import { signToken } from "../token";

describe("authMiddleware", () => {
  const app = new Hono<AppEnv>();
  app.use("/protected/*", authMiddleware);
  app.get("/protected/test", (c) => c.json({ playerId: c.get("playerId") }));

  it("allows request with valid token", async () => {
    const token = await signToken({ playerId: "p1", isAdmin: false });
    const res = await app.request("/protected/test", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.playerId).toBe("p1");
  });

  it("rejects request with no token", async () => {
    const res = await app.request("/protected/test");
    expect(res.status).toBe(401);
  });

  it("rejects request with invalid token", async () => {
    const res = await app.request("/protected/test", {
      headers: { Authorization: "Bearer invalid" },
    });
    expect(res.status).toBe(401);
  });
});

describe("adminMiddleware", () => {
  const app = new Hono<AppEnv>();
  app.use("/admin/*", authMiddleware, adminMiddleware);
  app.get("/admin/test", (c) => c.json({ ok: true }));

  it("allows admin token", async () => {
    const token = await signToken({ playerId: "admin", isAdmin: true });
    const res = await app.request("/admin/test", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  it("rejects non-admin token", async () => {
    const token = await signToken({ playerId: "p1", isAdmin: false });
    const res = await app.request("/admin/test", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import { createTestApp } from "../../test-utils";

describe("POST /api/player/join", () => {
  let app: ReturnType<typeof createTestApp>["app"];

  beforeEach(() => {
    const ctx = createTestApp();
    app = ctx.app;
  });

  it("creates a new player and returns token", async () => {
    const res = await app.request("/api/player/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Drew", pin: "1234" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.playerId).toBeDefined();
    expect(body.name).toBe("Drew");
  });

  it("signs in existing player with correct PIN", async () => {
    await app.request("/api/player/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Drew", pin: "1234" }),
    });
    const res = await app.request("/api/player/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Drew", pin: "1234" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.name).toBe("Drew");
  });

  it("rejects wrong PIN for existing player", async () => {
    await app.request("/api/player/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Drew", pin: "1234" }),
    });
    const res = await app.request("/api/player/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Drew", pin: "9999" }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects invalid input", async () => {
    const res = await app.request("/api/player/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", pin: "12" }),
    });
    // Should be 400 or 422 for validation error
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

describe("GET /api/player/me", () => {
  let app: ReturnType<typeof createTestApp>["app"];
  let db: ReturnType<typeof createTestApp>["db"];

  beforeEach(() => {
    const ctx = createTestApp();
    app = ctx.app;
    db = ctx.db;
  });

  it("returns player info for valid session", async () => {
    const joinRes = await app.request("/api/player/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Drew", pin: "1234" }),
    });
    const { token } = await joinRes.json();

    const res = await app.request("/api/player/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Drew");
    expect(body.playerId).toBeDefined();
  });

  it("returns 401 when player no longer exists in DB", async () => {
    const joinRes = await app.request("/api/player/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ghost", pin: "1234" }),
    });
    const { token, playerId } = await joinRes.json();

    // Delete the player (simulates DB reset)
    const { players } = await import("../../db/schema");
    const { eq } = await import("drizzle-orm");
    await db.delete(players).where(eq(players.id, playerId));

    const res = await app.request("/api/player/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 with no token", async () => {
    const res = await app.request("/api/player/me");
    expect(res.status).toBe(401);
  });
});

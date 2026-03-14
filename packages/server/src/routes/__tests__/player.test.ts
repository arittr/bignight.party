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

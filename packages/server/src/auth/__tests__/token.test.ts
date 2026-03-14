import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "../token";

describe("JWT tokens", () => {
  it("signs and verifies a player token", async () => {
    const token = await signToken({ playerId: "player_1", isAdmin: false });
    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.playerId).toBe("player_1");
    expect(payload!.isAdmin).toBe(false);
  });

  it("signs and verifies an admin token", async () => {
    const token = await signToken({ playerId: "admin", isAdmin: true });
    const payload = await verifyToken(token);
    expect(payload!.isAdmin).toBe(true);
  });

  it("returns null for invalid token", async () => {
    const payload = await verifyToken("garbage.token.here");
    expect(payload).toBeNull();
  });

  it("returns null for expired token", async () => {
    const token = await signToken({ playerId: "p1", isAdmin: false }, { expiresInSeconds: 0 });
    const payload = await verifyToken(token);
    expect(payload).toBeNull();
  });
});

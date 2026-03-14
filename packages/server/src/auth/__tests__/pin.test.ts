import { describe, expect, it } from "vitest";
import { hashPin, verifyPin } from "../pin";

describe("PIN hashing", () => {
  it("hashes a PIN to a different string", async () => {
    const hash = await hashPin("1234");
    expect(hash).not.toBe("1234");
    expect(hash.length).toBeGreaterThan(10);
  });

  it("verifies correct PIN against hash", async () => {
    const hash = await hashPin("5678");
    const result = await verifyPin("5678", hash);
    expect(result).toBe(true);
  });

  it("rejects incorrect PIN", async () => {
    const hash = await hashPin("1234");
    const result = await verifyPin("9999", hash);
    expect(result).toBe(false);
  });
});

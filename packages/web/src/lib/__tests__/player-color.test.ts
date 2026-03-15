import { describe, expect, it } from "vitest";
import { playerColor, PLAYER_COLORS } from "../player-color";

describe("playerColor", () => {
  it("returns a color from the palette", () => {
    const color = playerColor("some-player-id");
    expect(PLAYER_COLORS).toContain(color);
  });

  it("is deterministic — same id returns same color", () => {
    const color1 = playerColor("player-abc");
    const color2 = playerColor("player-abc");
    expect(color1).toBe(color2);
  });

  it("produces varied colors for different ids", () => {
    const ids = [
      "id-alpha", "id-bravo", "id-charlie", "id-delta", "id-echo",
      "id-foxtrot", "id-golf", "id-hotel", "id-india", "id-juliet",
    ];
    const colors = new Set(ids.map(playerColor));
    expect(colors.size).toBeGreaterThanOrEqual(4);
  });

  it("handles empty string without crashing", () => {
    expect(() => playerColor("")).not.toThrow();
    expect(PLAYER_COLORS).toContain(playerColor(""));
  });
});

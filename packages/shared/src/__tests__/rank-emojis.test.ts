import { describe, expect, it } from "vitest";
import { RANK_EMOJIS, getRankEmoji } from "../constants";

describe("RANK_EMOJIS", () => {
  it("maps rank 1 to goose", () => {
    expect(RANK_EMOJIS[1]).toBe("🪿");
  });

  it("maps rank 2 to silver medal", () => {
    expect(RANK_EMOJIS[2]).toBe("🥈");
  });

  it("maps rank 3 to bronze medal", () => {
    expect(RANK_EMOJIS[3]).toBe("🥉");
  });
});

describe("getRankEmoji", () => {
  it("returns the emoji for ranks 1-3", () => {
    expect(getRankEmoji(1)).toBe("🪿");
    expect(getRankEmoji(2)).toBe("🥈");
    expect(getRankEmoji(3)).toBe("🥉");
  });

  it("returns empty string for rank 4+", () => {
    expect(getRankEmoji(4)).toBe("");
    expect(getRankEmoji(99)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(getRankEmoji(null)).toBe("");
  });
});

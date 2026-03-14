import { describe, expect, it } from "vitest";
import { PlayerSchema, CreatePlayerSchema, SubmitPickSchema, MarkWinnerSchema } from "../schemas";
import { ALLOWED_REACTIONS } from "../constants";

describe("PlayerSchema", () => {
  it("validates a valid player", () => {
    const result = PlayerSchema.safeParse({
      id: "clx1234567890",
      name: "Drew",
      pin: "$2b$10$hashedvalue",
      createdAt: 1710000000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = CreatePlayerSchema.safeParse({ name: "", pin: "1234" });
    expect(result.success).toBe(false);
  });

  it("rejects pin shorter than 4 chars", () => {
    const result = CreatePlayerSchema.safeParse({ name: "Drew", pin: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects pin longer than 6 chars", () => {
    const result = CreatePlayerSchema.safeParse({ name: "Drew", pin: "1234567" });
    expect(result.success).toBe(false);
  });

  it("accepts valid create input", () => {
    const result = CreatePlayerSchema.safeParse({ name: "Drew", pin: "1234" });
    expect(result.success).toBe(true);
  });
});

describe("SubmitPickSchema", () => {
  it("validates valid pick submission", () => {
    expect(SubmitPickSchema.safeParse({ categoryId: "cat_1", nominationId: "nom_1" }).success).toBe(true);
  });
  it("rejects missing categoryId", () => {
    expect(SubmitPickSchema.safeParse({ nominationId: "nom_1" }).success).toBe(false);
  });
});

describe("MarkWinnerSchema", () => {
  it("validates valid winner marking", () => {
    expect(MarkWinnerSchema.safeParse({ categoryId: "cat_1", nominationId: "nom_1" }).success).toBe(true);
  });
});

describe("ALLOWED_REACTIONS", () => {
  it("contains exactly four emojis", () => {
    expect(ALLOWED_REACTIONS).toHaveLength(4);
  });
  it("includes expected emojis", () => {
    expect(ALLOWED_REACTIONS).toContain("🔥");
    expect(ALLOWED_REACTIONS).toContain("😍");
    expect(ALLOWED_REACTIONS).toContain("😱");
    expect(ALLOWED_REACTIONS).toContain("💀");
  });
});

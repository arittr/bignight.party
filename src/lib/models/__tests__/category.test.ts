/**
 * Category Model Tests
 *
 * Tests for the Category model using real test database.
 * Verifies markWinner() and clearWinner() atomic operations.
 */

import { buildCategory, buildEvent, buildNomination } from "tests/factories";
import { testPrisma } from "tests/utils/prisma";
import { beforeEach, describe, expect, it } from "vitest";
import * as categoryModel from "../category";

describe("categoryModel.markWinner", () => {
  let testCategoryId: string;
  let testNominationId: string;

  beforeEach(async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-c-1" }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({
        eventId: event.id,
        id: "category-c-1",
        isRevealed: false,
        winnerNominationId: null,
      }),
    });
    testCategoryId = category.id;

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nomination-c-1" }),
    });
    testNominationId = nomination.id;
  });

  it("atomically sets both isRevealed and winnerNominationId", async () => {
    const updatedCategory = await categoryModel.markWinner(testCategoryId, testNominationId);

    expect(updatedCategory.isRevealed).toBe(true);
    expect(updatedCategory.winnerNominationId).toBe(testNominationId);
  });

  it("persists changes to database", async () => {
    await categoryModel.markWinner(testCategoryId, testNominationId);

    // Fetch from DB to verify persistence
    const category = await testPrisma.category.findUnique({
      where: { id: testCategoryId },
    });

    expect(category?.isRevealed).toBe(true);
    expect(category?.winnerNominationId).toBe(testNominationId);
  });

  it("overwrites existing winner", async () => {
    // Create second nomination
    const nomination2 = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: testCategoryId, id: "nomination-c-1-2" }),
    });

    // Mark first winner
    await categoryModel.markWinner(testCategoryId, testNominationId);

    // Mark second winner (overwrite)
    const updatedCategory = await categoryModel.markWinner(testCategoryId, nomination2.id);

    expect(updatedCategory.winnerNominationId).toBe(nomination2.id);
    expect(updatedCategory.isRevealed).toBe(true);
  });

  it("throws error for nonexistent category", async () => {
    await expect(
      categoryModel.markWinner("nonexistent-category", testNominationId)
    ).rejects.toThrow();
  });
});

describe("categoryModel.clearWinner", () => {
  let testCategoryId: string;
  let testNominationId: string;

  beforeEach(async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-c-2" }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({
        eventId: event.id,
        id: "category-c-2",
        isRevealed: false,
        winnerNominationId: null,
      }),
    });
    testCategoryId = category.id;

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nomination-c-2" }),
    });
    testNominationId = nomination.id;

    // Mark winner first
    await categoryModel.markWinner(testCategoryId, testNominationId);
  });

  it("atomically clears both isRevealed and winnerNominationId", async () => {
    const updatedCategory = await categoryModel.clearWinner(testCategoryId);

    expect(updatedCategory.isRevealed).toBe(false);
    expect(updatedCategory.winnerNominationId).toBeNull();
  });

  it("persists changes to database", async () => {
    await categoryModel.clearWinner(testCategoryId);

    // Fetch from DB to verify persistence
    const category = await testPrisma.category.findUnique({
      where: { id: testCategoryId },
    });

    expect(category?.isRevealed).toBe(false);
    expect(category?.winnerNominationId).toBeNull();
  });

  it("can clear already cleared category without error", async () => {
    await categoryModel.clearWinner(testCategoryId);

    // Clear again
    const updatedCategory = await categoryModel.clearWinner(testCategoryId);

    expect(updatedCategory.isRevealed).toBe(false);
    expect(updatedCategory.winnerNominationId).toBeNull();
  });

  it("throws error for nonexistent category", async () => {
    await expect(categoryModel.clearWinner("nonexistent-category")).rejects.toThrow();
  });
});

describe("categoryModel.markWinner and clearWinner atomicity", () => {
  it("ensures both fields are set together", async () => {
    // Create test data
    const event = await testPrisma.event.create({
      data: buildEvent({ id: "event-c-3" }),
    });

    const category = await testPrisma.category.create({
      data: buildCategory({
        eventId: event.id,
        id: "category-c-3",
        isRevealed: false,
        winnerNominationId: null,
      }),
    });

    const nomination = await testPrisma.nomination.create({
      data: buildNomination({ categoryId: category.id, id: "nomination-c-3" }),
    });

    // Mark winner
    await categoryModel.markWinner(category.id, nomination.id);

    const markedCategory = await testPrisma.category.findUnique({
      where: { id: category.id },
    });

    // Both fields should be set
    expect(markedCategory?.isRevealed).toBe(true);
    expect(markedCategory?.winnerNominationId).toBe(nomination.id);

    // Clear winner
    await categoryModel.clearWinner(category.id);

    const clearedCategory = await testPrisma.category.findUnique({
      where: { id: category.id },
    });

    // Both fields should be cleared
    expect(clearedCategory?.isRevealed).toBe(false);
    expect(clearedCategory?.winnerNominationId).toBeNull();
  });
});
